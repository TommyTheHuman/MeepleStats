import os
import requests
import time
import xml.etree.ElementTree as ET
from tqdm import tqdm

from .db import games_collection

def import_games_from_bgg(username):
    # Import the collection of games from the user's BGG collection - NO EXPANSIONS
    url_collection = f'https://boardgamegeek.com/xmlapi2/collection?username={username}&own=1&excludesubtype=boardgameexpansion'
    bgg_token = os.getenv('BGG_API_KEY')
    headers = {}
    if bgg_token:
        headers['Authorization'] = f'Bearer {bgg_token}'
    response = requests.get(url_collection, headers=headers)

    while response.status_code == 202:
        # request queued, retry in 2 seconds
        time.sleep(2)
        response = requests.get(url_collection, headers=headers)

    if response.status_code != 200:
        print("Error in collection request.")
        return
    parse_collection(response.text, headers)
        
    # Import the collection of expansions from the user's BGG collection
    url_collection_exp = f'https://boardgamegeek.com/xmlapi2/collection?username={username}&own=1&subtype=boardgameexpansion'

    response = requests.get(url_collection_exp, headers=headers)
    
    while response.status_code == 202:
        # request queued, retry in 2 seconds
        time.sleep(2)
        response = requests.get(url_collection_exp, headers=headers)
    
    if response.status_code != 200:
        print("Error in collection request.")
        return
    parse_collection(response.text, headers, expansions=True)



def parse_collection(xml, headers, expansions=False):
    root = ET.fromstring(xml)
    game_ids = []
    for game in root.findall('item'):
        game_ids.append(game.attrib['objectid'])
    if len(game_ids) == 0:
        print("No games found.")
        return
    elif len(game_ids) < 20:
        # API max limit is 20 games per request
        # list to string
        game_ids_str = ','.join(game_ids)
        request_games(game_ids_str, headers, expansions)
    else:
        # API max limit is 20 games per request
        # split the list in chunks of 20 games
        for i in range(0, len(game_ids), 20): # FIXME: check if this works
            request_games(','.join(game_ids[i:i+20]), headers, expansions)

def request_games(game_ids, headers, expansions):
    url_game = f'https://boardgamegeek.com/xmlapi2/thing?id={game_ids}'
    response = requests.get(url_game, headers=headers)
    if response.status_code != 200:
        print("Error in game request.")
        return
    print("Response received, parsing...")
    root = ET.fromstring(response.text)
    if expansions:
        for expansion in tqdm(root.findall('item')):
            # Create a dictionary with the expansion data
            expansion_data = {
                'bgg_id': expansion.attrib['id'],
                'name': expansion.find('name[@type=\'primary\']').attrib['value'],
                "type": "expansion",
                'min_players': expansion.find('minplayers').attrib['value'],
                'max_players': expansion.find('maxplayers').attrib['value'],
                'average_duration': expansion.find('playingtime').attrib['value'],
                'image': {'url': expansion.find('image').text,
                        'thumbnail': expansion.find('thumbnail').text
                        },
                'is_cooperative': False if expansion.find('link[@id=\'2023\']') is None else True,
                'expansions': [],
                'description': expansion.find('description').text,
                'matches': [],
                'record_score_by_player': ""
            }
            # Insert the expansion data in the database if not already present
            if games_collection.find_one({'bgg_id': expansion_data['bgg_id']}) is None:
                games_collection.insert_one(expansion_data)
            # Update the base game with the expansion data
            links = expansion.findall('link')
            base_game_id = None
            for link in links:
                if link.attrib.get('type') == 'boardgameexpansion' and link.attrib.get('inbound') == 'true':
                    base_game_id = link.attrib['id']
                    break 
            # Usa base_game_id per la query in MongoDB
            if base_game_id:
                base_game = games_collection.find_one({'bgg_id': base_game_id})
            if base_game is not None:
                base_game['expansions'].append(expansion_data['bgg_id'])
                games_collection.update_one({'bgg_id': base_game['bgg_id']}, {"$set": base_game})
    else:
        for game in tqdm(root.findall('item')):
            # Create a dictionary with the game data
            game_data = {
                'bgg_id': game.attrib['id'],
                'name': game.find('name[@type=\'primary\']').attrib['value'],
                "type": "base",
                'min_players': game.find('minplayers').attrib['value'],
                'max_players': game.find('maxplayers').attrib['value'],
                'average_duration': game.find('playingtime').attrib['value'],
                'image': {'url': game.find('image').text,
                        'thumbnail': game.find('thumbnail').text
                        },
                'is_cooperative': False if game.find('link[@id=\'2023\']') is None else True,
                'expansions': [],
                'description': game.find('description').text,
                'matches': [],
                'record_score_by_player': {'player_id': "", 'score': 0},
                'average_score': 0
            }
            #print(game_data)
            # Insert the game data in the database if not already present
            if games_collection.find_one({'bgg_id': game_data['bgg_id']}) is None:
                games_collection.insert_one(game_data)
