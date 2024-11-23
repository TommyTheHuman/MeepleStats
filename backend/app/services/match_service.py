from .db import matches_collection

def add_match(match):
    """Aggiungi una nuova partita."""
    result = matches_collection.insert_one(match)
    return str(result.inserted_id)

def get_match_by_id(match_id):
    """Trova una partita per ID."""
    return matches_collection.find_one({"_id": match_id})

def get_matches_by_game(game_id):
    """Trova tutte le partite di un gioco."""
    return list(matches_collection.find({"game_id": game_id}))

def update_match(match_id, updates):
    """Aggiorna una partita."""
    matches_collection.update_one({"_id": match_id}, {"$set": updates})

def delete_match(match_id):
    """Elimina una partita."""
    matches_collection.delete_one({"_id": match_id})
