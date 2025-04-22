# Harmless PennyWise: Your Friendly College Budget Companion

Harmless Pennywise is a smart budgeting web application designed specifically for college students. It helps users:

- Track monthly income and categorized expenses
- Get classified as a **Saver**, **Balanced**, or **Over-Spender**
- Adjust budgets dynamically using sliders
- Gain real-time insights through interactive data visualizations
- Compare spending behavior anonymously with peers

The app uses AI-driven financial categorization and offers intuitive tools to make budgeting both insightful and engaging.

🔗 **Live Web App**: [https://harmless-pennywise.up.railway.app/](https://harmless-pennywise.up.railway.app/)

---

## 🖥️ Tech Stack
- **Frontend:** React.js, D3.js, Chart.js
- **Backend:** Python, FastAPI
- **Database:** MySQL (Dockerized)
- **ML Models:** Scikit-learn (GMM + Logistic Regression)
- **Deployment:** Railway (Production)

---

## 🚀 Local Setup Instructions

### 🔧 Backend Setup

1. Install the necessary Python packages:
```sh
pip install fastapi uvicorn pymysql python-dotenv
```

2. Pull the MySQL Docker image:
```sh
docker pull mysql:latest
```

---

### ▶️ Running the Backend

To start the backend for the **first time** or after deleting the MySQL container:
```sh
./clean_startup.sh
```

> 💡 *If the script fails, try increasing sleep duration in the script to allow the MySQL container more time to initialize.*

If you've already run the container previously, use:
```sh
./startup.sh
```

The backend will be available at:
- `http://localhost:8000/users`
- `http://localhost:8000/`

---

### 🛠️ Optional: Access MySQL Container Directly
```sh
docker exec -it harmless_pennywise_db mysql -uroot -p
```
- Password: `root`

Then you can run commands like:
```sql
show databases;
use harmless_pennywise;
show tables;
select * from users;
```

---

### 🖼️ Frontend Setup

Navigate to the frontend directory and run:
```sh
npm install
```

### ▶️ Running the Frontend
```sh
npm run dev
```
Access the frontend on:
- `http://localhost:5173/`

---

## 🧠 Behind the Scenes

### ⚙️ Data Processing & ML:
- Uses a [Kaggle student spending dataset](https://www.kaggle.com/datasets/sumanthnimmagadda/student-spending-dataset) with features like income, tuition, food, etc.
- Applies **Gaussian Mixture Modeling** for soft clustering into 3 categories.
- Uses **Logistic Regression** to draw decision boundaries between categories.
- All this powers real-time classification and feedback in the frontend.

### 📊 Visualizations:
- **Dynamic Scatterplot**: Shows your spending position vs. peers
- **Interactive Sliders**: Adjust spending and see instant updates
- **Grouped Bar Chart**: Compare your category-wise spending with peer averages

---

## 🧪 Additional Details on Startup Scripts

The `clean_startup.sh` script:
- Starts a new MySQL container:
```sh
docker run --name harmless_pennywise_db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=harmless_pennywise \
  -p 3307:3306 -d mysql:latest
```
- Imports data into MySQL from a CSV:
```sh
python database.py
```
- Launches the FastAPI server:
```sh
uvicorn main:app --reload
```

To stop and remove the MySQL container:
```sh
docker rm -f harmless_pennywise_db
```

---

## 🙌 Contributing
Pull requests and issues are welcome! Help us improve financial literacy for students everywhere 💸

---

## 📬 Contact
For any questions or support, reach out to the team:
- Bhavan Dondapati
- Vamshi Krishna Battala
- Sriram Suresh

---

Happy budgeting! 🎯
