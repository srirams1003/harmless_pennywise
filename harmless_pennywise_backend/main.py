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

@app.post("/predict_category")
# Define function to predict using logistic regression decision boundaries
def predict_spending_category(new_data:StudentInput):
    """
    Predicts the spending category for a new student based on the logistic regression boundaries.
    """
    new_data = new_data.model_dump()
    semester_based_cols = ["tuition", "financial_aid", "books_supplies"]

    # Create new columns for semester-based values (rounded to nearest integer)
    for col in semester_based_cols:
        new_data[f"{col}_monthly"] = round(new_data[col] / 6)

    # Compute total spending
    spending_features = ["food", "entertainment", "miscellaneous", "housing", "transportation",
                         "books_supplies_monthly", "personal_care", "technology", "health_wellness", "tuition_monthly"]
    new_data["total_spending"] = sum(new_data[col] for col in spending_features)

    # Compute spending ratio
    new_data["spending_ratio"] = new_data["total_spending"] / (new_data["monthly_income"] + new_data["financial_aid_monthly"])

    # Prepare the new data for prediction
    new_data_df = pd.DataFrame([{
    "spending_ratio": new_data["spending_ratio"],
    "total_spending": new_data["total_spending"]
    }])

    # Load boundary_models
    with open("./spending_analysis_outputs/boundary_models.pkl", "rb") as f:
        boundary_models = pickle.load(f)

    # Use logistic regression models to determine category
    prob_saver_balanced = boundary_models["saver_balanced"].predict_proba(new_data_df)[0][1]  # Probability of being in "Balanced"
    prob_balanced_overspender = boundary_models["balanced_overspender"].predict_proba(new_data_df)[0][1]  # Probability of being in "Over-Spender"

    # Determine category based on where the point falls relative to the decision boundaries
    if prob_saver_balanced < 0.5:
        category_label = "Saver"
    elif prob_balanced_overspender < 0.5:
        category_label = "Balanced"
    else:
        category_label = "Over-Spender"

    df = pd.read_csv("./spending_analysis_outputs/student_spending_categorized_gmm.csv")

    # Update y-axis limits to include the new point
    y_min, y_max = df["total_spending"].min(), df["total_spending"].max()
    y_min_new = min(y_min, new_data["total_spending"])
    y_max_new = max(y_max, new_data["total_spending"])
    buffer_new = (y_max_new - y_min_new) * 0.05  # 5% buffer
    
    log_reg_saver_balanced = boundary_models["saver_balanced"]
    log_reg_balanced_overspender = boundary_models["balanced_overspender"]
    
    # Generate x-values for boundary lines
    x_vals = np.linspace(min(df["spending_ratio"].min(), new_data["spending_ratio"]), max(df["spending_ratio"].max(), new_data["spending_ratio"]), 100)

    # Compute decision boundaries using logistic regression
    boundary_1_y = -(log_reg_saver_balanced.coef_[0][0] * x_vals + log_reg_saver_balanced.intercept_[0]) / log_reg_saver_balanced.coef_[0][1]
    boundary_2_y = -(log_reg_balanced_overspender.coef_[0][0] * x_vals + log_reg_balanced_overspender.intercept_[0]) / log_reg_balanced_overspender.coef_[0][1]

    return [category_label, new_data["spending_ratio"], new_data["total_spending"]]