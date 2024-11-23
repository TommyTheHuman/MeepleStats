from .db import players_collection

def add_player(player):
    """Aggiungi un nuovo giocatore."""
    result = players_collection.insert_one(player)
    return str(result.inserted_id)

def get_player_by_id(player_id):
    """Trova un giocatore per ID."""
    return players_collection.find_one({"_id": player_id})

def update_player(player_id, updates):
    """Aggiorna i dati di un giocatore."""
    players_collection.update_one({"_id": player_id}, {"$set": updates})

def delete_player(player_id):
    """Elimina un giocatore."""
    players_collection.delete_one({"_id": player_id})
