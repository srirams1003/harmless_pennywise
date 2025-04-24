import csv, pymysql
import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Database configuration loaded from environment variables
DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST"),
    "port": int(os.getenv("MYSQL_PORT")),
    "user": os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "database": os.getenv("MYSQL_DB"),
}

# Path to the CSV file containing student spending data
CSV_FILE = "./student_spending.csv"  # Update with your actual CSV file path

def create_table():
    """Creates the 'users' table in the database if it does not already exist."""
    # Establish a connection to the MySQL database
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # SQL query to create the 'users' table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,  # Auto-incrementing primary key
            age INT,  # Age of the user
            gender VARCHAR(50),  # Gender of the user
            year_in_school VARCHAR(50),  # Year in school (e.g., freshman, sophomore)
            major VARCHAR(100),  # Major field of study
            monthly_income INT,  # Monthly income of the user
            financial_aid INT,  # Financial aid received
            tuition INT,  # Tuition expenses
            housing INT,  # Housing expenses
            food INT,  # Food expenses
            transportation INT,  # Transportation expenses
            books_supplies INT,  # Books and supplies expenses
            entertainment INT,  # Entertainment expenses
            personal_care INT,  # Personal care expenses
            technology INT,  # Technology-related expenses
            health_wellness INT,  # Health and wellness expenses
            miscellaneous INT,  # Miscellaneous expenses
            preferred_payment_method VARCHAR(50)  # Preferred payment method
        )
    """)
    
    # Commit the changes and close the connection
    conn.commit()
    cursor.close()
    conn.close()

def load_csv_to_mysql():
    """Loads data from the CSV file into the MySQL database if the table is empty."""
    # Establish a connection to the MySQL database
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Check if the 'users' table already contains data
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        print("Table already contains data. Skipping CSV import.")
        cursor.close()
        conn.close()
        return

    # Open the CSV file for reading
    with open("./student_spending.csv", "r") as file:
        reader = csv.reader(file)
        next(reader)  # Skip the header row

        # SQL query to insert data into the 'users' table
        sql = """
        INSERT INTO users (
            age, gender, year_in_school, major, monthly_income, financial_aid, tuition, housing, food,
            transportation, books_supplies, entertainment, personal_care, technology, health_wellness,
            miscellaneous, preferred_payment_method
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        # Iterate through each row in the CSV file and insert it into the database
        for row in reader:
            row = row[1:]  # Skip the first empty column in the CSV file
            cursor.execute(sql, tuple(row))  # Insert the row into the database

    # Commit the changes and close the connection
    conn.commit()
    cursor.close()
    conn.close()
    print("CSV data successfully loaded into MySQL.")

# Function to get a database connection with a dictionary cursor
def get_db_connection():
    return pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)

if __name__ == "__main__":
    # Create the 'users' table if it does not exist
    create_table()
    # Load data from the CSV file into the database
    load_csv_to_mysql()
