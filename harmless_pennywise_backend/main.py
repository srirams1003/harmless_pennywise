from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import pymysql
from database import get_db_connection

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
@app.post("/users")
def add_user(name: str, age: int):
    conn = get_db_connection()
    with conn.cursor() as cursor:
        sql = "INSERT INTO users (name, age) VALUES (%s, %s)"
        cursor.execute(sql, (name, age))
        conn.commit()
    conn.close()
    return {"message": "User added successfully!"}
