from fastapi import FastAPI, Depends
import pymysql
from database import get_db_connection

app = FastAPI()

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
