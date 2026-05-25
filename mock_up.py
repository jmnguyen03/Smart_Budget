
import os
import random
from datetime import datetime, timedelta
from faker import Faker
from supabase import create_client
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

# Initialize Supabase client using environment variables
# Replace the strings below with your actual project URL and Service Role Key if they are not in your .env file
SUPABASE_URL = os.getenv("https://fbecswkpwnsuksfrxkxw.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZWNzd2twd25zdWtzZnJ4a3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODA2NTcsImV4cCI6MjA4NDM1NjY1N30.TNLsKUvMBtx3dsQo081DM91R_sGtxGWF9wk-2LbYoVY")

# Diagnostic check
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Initialize Faker
fake = Faker()

def generate_transactions(num_records=50):
    transactions = []
    today = datetime.now()
    
    for _ in range(num_records):
        # Random date within the last 21 days
        days_ago = random.randint(0, 21)
        transaction_date = today - timedelta(days=days_ago)
        
        # Specific logic: Rent only on the 1st of the month
        if transaction_date.day == 1:
            description = "Rent"
            amount = 1200.00
            category = "Housing"
        else:
            description = fake.company()
            amount = round(random.uniform(5.0, 200.0), 2)
            category = random.choice(["Food", "Transport", "Entertainment", "Utilities"])
            
        transactions.append({
            "date": transaction_date.strftime("%Y-%m-%d"),
            "description": description,
            "amount": amount,
            "category": category,
            # Ensure this user_id exists in your auth.users table
            "user_id": "YOUR_USER_UUID" 
        })
        
    return transactions

# Generate and insert data
if __name__ == "__main__":
    data = generate_transactions(50)
    try:
        response = supabase.table("expenses").insert(data).execute()
        print(f"Successfully inserted {len(response.data)} transactions.")
    except Exception as e:
        print(f"An error occurred: {e}")