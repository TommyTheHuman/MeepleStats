from pymongo import MongoClient

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017"  # update with your MongoDB URI
DB_NAME = "meeple_stats"

# Connectron to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collections
games_collection = db["games"]
matches_collection = db["matches"]
players_collection = db["players"]
