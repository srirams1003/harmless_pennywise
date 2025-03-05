import csv, pymysql
import os
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST"),
    "port": int(os.getenv("MYSQL_PORT")),
    "user": os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "database": os.getenv("MYSQL_DB"),
}

CSV_FILE = "./student_spending.csv"  # Update with your actual CSV file path

def create_table():
    """Creates the 'users' table if it does not exist."""
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            age INT,
            gender VARCHAR(50),
            year_in_school VARCHAR(50),
            major VARCHAR(100),
            monthly_income INT,
            financial_aid INT,
            tuition INT,
            housing INT,
            food INT,
            transportation INT,
            books_supplies INT,
            entertainment INT,
            personal_care INT,
            technology INT,
            health_wellness INT,
            miscellaneous INT,
            preferred_payment_method VARCHAR(50)
        )
    """)
    
    conn.commit()
    cursor.close()
    conn.close()

def load_csv_to_mysql():
    """Loads CSV data into MySQL if the table is empty."""
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Check if the table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        print("Table already contains data. Skipping CSV import.")
        cursor.close()
        conn.close()
        return

    with open("./student_spending.csv", "r") as file:
        reader = csv.reader(file)
        next(reader)  # Skip the header

        sql = """
        INSERT INTO users (
            age, gender, year_in_school, major, monthly_income, financial_aid, tuition, housing, food,
            transportation, books_supplies, entertainment, personal_care, technology, health_wellness,
            miscellaneous, preferred_payment_method
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        for row in reader:
            row = row[1:]  # Skip the first empty column
            cursor.execute(sql, tuple(row))  # Insert each row into the database

    conn.commit()
    cursor.close()
    conn.close()
    print("CSV data successfully loaded into MySQL.")

# Function to get a database connection
def get_db_connection():
    return pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)

if __name__ == "__main__":
    create_table()
    load_csv_to_mysql()
