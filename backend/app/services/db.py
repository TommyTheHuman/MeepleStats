from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = os.getenv('DB_NAME')

# Connectron to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collections
games_collection = db["games"]
matches_collection = db["matches"]
players_collection = db["players"]
wishlists_collection = db["wishlists"]