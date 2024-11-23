from .db import games_collection

def add_game(game):
    """Aggiungi un nuovo gioco."""
    result = games_collection.insert_one(game)
    return str(result.inserted_id)

def get_game_by_id(game_id):
    """Trova un gioco per ID."""
    return games_collection.find_one({"_id": game_id})

def get_all_games():
    """Ritorna tutti i giochi."""
    return list(games_collection.find())

def update_game(game_id, updates):
    """Aggiorna i dati di un gioco."""
    games_collection.update_one({"_id": game_id}, {"$set": updates})

def delete_game(game_id):
    """Elimina un gioco."""
    games_collection.delete_one({"_id": game_id})
