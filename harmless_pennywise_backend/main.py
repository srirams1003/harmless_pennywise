from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import pymysql
from database import get_db_connection
from pydantic import BaseModel
import numpy as np
import pandas as pd
import pickle

app = FastAPI()

origins = [
    "http://localhost:5173",  # Or the specific origin of your React app
    "http://localhost",       # In case you access it without the port
    "*"                      # Optional, allows all origins (for development, not recommended for production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Harmless Pennywise API"}

# Fetch all users
@app.get("/users")
def get_users():
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM users")  # Assuming `users` table exists
        result = cursor.fetchall()
    conn.close()
    return result

# Insert a new user
# TODO: this method needs to be modified because we do not have add user names into the db. At least, that's how the dataset we use does things.
# this is just a sample method below
@app.post("/users")
def add_user(name: str, age: int):
    conn = get_db_connection()
    with conn.cursor() as cursor:
        sql = "INSERT INTO users (name, age) VALUES (%s, %s)"
        cursor.execute(sql, (name, age))
        conn.commit()
    conn.close()
    return {"message": "User added successfully!"}


@app.post("/initial_data")
def make_initial_data():
    import pickle
    import numpy as np
    import pandas as pd

    # Load boundary_models
    with open("./spending_analysis_outputs/boundary_models.pkl", "rb") as f:
        boundary_models = pickle.load(f)

    log_reg_saver_balanced = boundary_models["saver_balanced"]
    log_reg_balanced_overspender = boundary_models["balanced_overspender"]

    # Load dataset with computed spending_margin
    df = pd.read_csv("./spending_analysis_outputs/student_spending_categorized_gmm.csv")

    # Generate x-values for spending_margin boundaries
    max_margin = np.round(df["spending_margin"].max())
    x_vals = np.array([max_margin - 1, max_margin])

    # Compute decision boundaries
    boundary_1_y = -(log_reg_saver_balanced.coef_[0][0] * x_vals + log_reg_saver_balanced.intercept_[0]) / log_reg_saver_balanced.coef_[0][1]
    boundary_2_y = -(log_reg_balanced_overspender.coef_[0][0] * x_vals + log_reg_balanced_overspender.intercept_[0]) / log_reg_balanced_overspender.coef_[0][1]

    # Convert to lists for return
    x_vals = x_vals.tolist()
    boundary_1_y = boundary_1_y.tolist()
    boundary_2_y = boundary_2_y.tolist()

    boundary_coordinates = {
        "saver_balanced": [[x_vals[0], boundary_1_y[0]], [x_vals[1], boundary_1_y[1]]],
        "balanced_overspender": [[x_vals[0], boundary_2_y[0]], [x_vals[1], boundary_2_y[1]]],
    }

    # Replace spending_ratio with spending_margin in dataset_points
    dataset_points = [
        [row['spending_category'], row['spending_margin'], row['total_spending']]
        for _, row in df.iterrows()
    ]

    df_original = pd.read_csv("student_spending.csv")
    if "Unnamed: 0" in df_original.columns:
        df_original = df_original.drop(columns=["Unnamed: 0"])
    original_points = df_original.to_dict(orient='records')

    return {
        "boundary_coordinates": boundary_coordinates,
        "dataset_points": dataset_points,
        "original_points": original_points
    }

class StudentInput(BaseModel):
    age: int
    gender: str
    year_in_school: str
    major: str
    monthly_income: float
    financial_aid: float
    tuition: float
    housing: float
    food: float
    transportation: float
    books_supplies: float
    entertainment: float
    personal_care: float
    technology: float
    health_wellness: float
    miscellaneous: float
    preferred_payment_method: str


@app.post("/calculate_financial_metrics")
def calculate_financial_metrics(user_inputs: dict):
    """
    Calculate financial metrics based on user inputs.
    Adjust tuition, financial aid, and books_supplies by dividing by 4 (semester to monthly).
    """
    # Adjust semester-based inputs to monthly
    adjusted_user_inputs = user_inputs.copy()
    adjusted_user_inputs["tuition"] = adjusted_user_inputs["tuition"] / 4
    adjusted_user_inputs["financial_aid"] = adjusted_user_inputs["financial_aid"] / 4
    adjusted_user_inputs["books_supplies"] = adjusted_user_inputs["books_supplies"] / 4

    # Calculate monthly income
    monthly_income = user_inputs["monthly_income"] + adjusted_user_inputs["financial_aid"]

    # Calculate monthly spending
    monthly_spending = sum(
        value for key, value in adjusted_user_inputs.items()
        if key not in ["monthly_income", "financial_aid"]
    )

    # Calculate financial metrics
    budget_margin = monthly_income - monthly_spending;
    savings_amount = monthly_income - monthly_spending
    savings_rate = (savings_amount / monthly_income) * 100 if monthly_income != 0 else 0

    # User point coordinates (using monthly values)
    user_point_x = budget_margin
    user_point_y = monthly_spending

    return {
        "adjusted_user_inputs": adjusted_user_inputs,
        "monthly_income": monthly_income,
        "monthly_spending": monthly_spending,
        "budget_margin": budget_margin,
        "savings_amount": savings_amount,
        "savings_rate": savings_rate,
        "user_point_x": user_point_x,
        "user_point_y": user_point_y
    }

@app.post("/predict_category")
# Define function to predict using logistic regression decision boundaries
def predict_spending_category(new_data: StudentInput):
    """
    Predicts the spending category for a new student using logistic regression boundaries
    trained on spending_margin and total_spending.
    """
    new_data = new_data.model_dump()

    # Process semester-based columns
    semester_based_cols = ["tuition", "financial_aid", "books_supplies"]
    for col in semester_based_cols:
        new_data[f"{col}_monthly"] = round(new_data[col] / 6)

    # Calculate total spending
    spending_features = ["food", "entertainment", "miscellaneous", "housing", "transportation",
                         "books_supplies_monthly", "personal_care", "technology", "health_wellness", "tuition_monthly"]
    new_data["total_spending"] = sum(new_data[col] for col in spending_features)

    # Calculate spending margin
    new_data["spending_margin"] = new_data["total_spending"] - (new_data["monthly_income"] + new_data["financial_aid_monthly"])

    # Prepare for prediction
    new_data_df = pd.DataFrame([{
        "spending_margin": new_data["spending_margin"],
        "total_spending": new_data["total_spending"]
    }])

    # Load logistic regression models
    with open("./spending_analysis_outputs/boundary_models.pkl", "rb") as f:
        boundary_models = pickle.load(f)

    prob_sb = boundary_models["saver_balanced"].predict_proba(new_data_df)[0][1]
    prob_bo = boundary_models["balanced_overspender"].predict_proba(new_data_df)[0][1]

    if prob_sb < 0.5:
        category_label = "Saver"
    elif prob_bo < 0.5:
        category_label = "Balanced"
    else:
        category_label = "Over-Spender"

    # Load full dataset to compute feature averages
    df = pd.read_csv("student_spending.csv")
    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])

    averages = {
        "monthly_income": df['monthly_income'].mean(),
        "financial_aid": df['financial_aid'].mean(),
        "tuition": df['tuition'].mean(),
        "housing": df['housing'].mean(),
        "food": df['food'].mean(),
        "transportation": df['transportation'].mean(),
        "books_supplies": df['books_supplies'].mean(),
        "entertainment": df['entertainment'].mean(),
        "personal_care": df['personal_care'].mean(),
        "technology": df['technology'].mean(),
        "health_wellness": df['health_wellness'].mean(),
        "miscellaneous": df['miscellaneous'].mean(),
    }

    return {
        "all_users_average": averages,
        "datapoint": [category_label, new_data["spending_margin"], new_data["total_spending"]]
    }

