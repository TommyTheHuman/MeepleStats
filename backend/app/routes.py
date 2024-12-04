from datetime import datetime, timedelta
from flask import Blueprint, jsonify, render_template, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, decode_token
from jwt.exceptions import InvalidTokenError
from werkzeug.security import generate_password_hash, check_password_hash
import os
import uuid
from bson import ObjectId
from flask import current_app
import requests

from .services.db import players_collection, games_collection, matches_collection, wishlists_collection

#bp = Blueprint('main', __name__)


auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/check-auth', methods=['GET'])
def check_auth():
    token = request.cookies.get('jwt_token')
    if not token:
        return jsonify({'authenticated': False}), 401
    try:
        decode_token(token)
        return jsonify({'authenticated': True}), 200
    except InvalidTokenError:
        return jsonify({'authenticated': False}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400

    # Check if the username already exists
    user = players_collection.find_one({'username': username})
    if user:
        return jsonify({'error': 'Username already exists'}), 400
    
    # Hash password and save the user
    user_data = {
        'username': username,
        'password': generate_password_hash(password),
        'email': email,
        'image': "",
        'created_at': datetime.now(),
        'achievements': [],
        'matches': [{}],
        'wins': 0,
        'winsteaks': 0,
        'losses': 0,
        'total_matches': 0,
        'num_competitive_win': 0,
    }
    players_collection.insert_one(user_data)

    # Generate the JWT token and return it
    access_token = create_access_token(identity=username)
    response = jsonify({'message': 'Login successful'})
    response.set_cookie('jwt_token', access_token, httponly=True, secure=True, max_age=timedelta(weeks=4))
    return response, 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400

    # Check if the user exists
    user = players_collection.find_one({'username': username})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid username or password'}), 400

    # Generate the JWT token and return it
    access_token = create_access_token(identity=username)
    response = jsonify({'message': 'Login successful'})
    response.set_cookie('jwt_token', access_token, httponly=True, secure=True, max_age=timedelta(weeks=4), samesite="None", partitioned=True)
    return response, 200

# FIXME: logout route

data_bp = Blueprint('games', __name__)


@data_bp.route('/games', methods=['GET'])
@jwt_required()
def get_games():
    print(request.cookies)
    print(get_jwt_identity())
    try:
        games = games_collection.find()
        
        games_data = []

        for game in games:
            game['_id'] = str(game['_id'])
            games_data.append(game)

        return jsonify(games_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_bp.route('/players', methods=['GET'])
def get_players():

    try:
        players = players_collection.find()
        
        players_data = []

        for player in players:
            player['_id'] = str(player['_id'])
            players_data.append(player)

        return jsonify(players_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_bp.route('/logmatch', methods=['POST'])
@jwt_required()
def log_match():

    # Create the upload folder if it doesn't exist
    upload_folder = current_app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    # Parse match data
    date = request.form.get('date')
    duration = request.form.get('duration')
    game_name = request.form.get('game')
    game_id = request.form.get('game_id')
    note = request.form.get('note')
    isWin = bool(request.form.get('isWin'))

    # Handle file upload
    image_path = None
    if 'image' in request.files:
        #return jsonify({'error': 'No image part'}), 400
        file = request.files['image']

        # Check if the file is empty
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        # Create a unique filename
        unique_file = f"{uuid.uuid4()}_{file.filename}"
        image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_file)

        file.save(image_path)

    # Parse player data
    players = []
    index = 0
    while True:
        player_id = request.form.get(f'players[{index}][id]')
        player_score = request.form.get(f'players[{index}][score]')
        player_name = request.form.get(f'players[{index}][name]')
        if player_id is None:
            break
        players.append({'id': player_id, 'name': player_name, 'score': int(player_score)})
        index += 1
                                                  

    # Fill mongo collections

    # Compute winner, worst_score_player, is_cooperative, total_score

    game = games_collection.find_one({'bgg_id': game_id})
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    

    game_highest_score = game['record_score_by_player']['score']

    if (game['is_cooperative']):
        # Check if the match is cooperative --> each player wins
        winner = [player['id'] for player in players]
        total_score = None
        worst_score_player = None
    else:
        # Check if the match is not cooperative --> the player with the highest score wins
        winner = max(players, key=lambda x: x['score'])['id']
        total_score = sum([player['score'] for player in players])
        worst_score_player = min(players, key=lambda x: x['score'])['id']

    # Create the match
    match_data = {
        'game_id': game_id,
        'game_name': game_name,
        'date': date,
        'players': [player['id'] for player in players],
        'expansions_used': [],
        'notes': note,
        'image_path': image_path,
        'game_duration': duration,
        'winner': winner,
        'worst_score_player': worst_score_player,
        'is_cooperative': game['is_cooperative'],
        'total_score': total_score,
    }

    #print(match_data)

    result = matches_collection.insert_one(match_data)
    match_id = result.inserted_id 

    # Update players' stats


    for player in players:
        player_data = players_collection.find_one({'_id': ObjectId(player['id'])})
        print(isWin)
        player_data['total_matches'] += 1
        if game['is_cooperative'] and isWin:
            player_data['wins'] += 1
        elif not game['is_cooperative'] and player['id'] == winner:
            player_data['wins'] += 1
            player_data['num_competitive_win'] += 1
        else:
            player_data['losses'] += 1
        
        # update player's match history
        player_data['matches'].append({
            'match_id': str(match_id),
            'game_id': game_id,
            'is_winner': player['id'] == winner,
            'score': player['score'],
            'date': date,
        })

        if player['score'] > game_highest_score:
            game['record_score_by_player'] = {
                'id': player['id'],
                'score': player['score'],
            }

        # update player's Collection
        players_collection.update_one({'_id': ObjectId(player['id'])}, {'$set': player_data})

    # Update game match history
    game['matches'].append({
        'match_id': str(match_id),
        'game_duration': duration,
        'total_score': total_score,
    })

    print(game['matches'])

    # Loop over matches and update average score
    total_score = 0
    for match in game['matches']:
        total_score += match['total_score']
    game['average_score'] = total_score / len(game['matches'])

    # Update game's Collection
    games_collection.update_one({'bgg_id': game_id}, {'$set': game})

    return jsonify({'message': 'Match logged successfully'}), 201

@data_bp.route('/wishlist', methods=['GET'])
# @jwt_required()
def get_wishlist():
    try:
        wishlists = wishlists_collection.find()
        
        wishlists_data = []

        for wishlist in wishlists:
            wishlist['_id'] = str(wishlist['_id'])
            wishlists_data.append(wishlist)

        return jsonify(wishlists_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_bp.route('/addwishlist', methods=['POST'])
# @jwt_required()
def add_wishlist():
    data = request.get_json()
    game_id = data.get('game_id')
    notes = data.get('notes')

    if not game_id:
        return jsonify({'error': 'Missing username or game_id'}), 400

    # Check if the game is already in the wishlist
    game = wishlists_collection.find_one({'game_id': game_id})
    if game:
        return jsonify({'error': 'Game already in the wishlist'}), 400
    
    #username = get_jwt_identity() #FIXME: uncomment this line
    username = "bb"

    user = players_collection.find_one({'username': username})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get the game information from BGG API
    bgg_api_url = f"https://www.boardgamegeek.com/xmlapi2/thing?id={game_id}"
    response = requests.get(bgg_api_url)

    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch game information from BGG API'}), 500

    # Parse the XML response (assuming the response is in XML format)
    import xml.etree.ElementTree as ET
    root = ET.fromstring(response.content)
    game = root.find('item')

    # Save the game in the wishlist
    game_data = {
        'username': username,
        'game_id': game_id,
        'game_name': game.find('name[@type=\'primary\']').attrib['value'],
        'min_players': game.find('minplayers').attrib['value'],
        'max_players': game.find('maxplayers').attrib['value'],
        'average_duration': game.find('playingtime').attrib['value'],
        'image': {'url': game.find('image').text,
                  'thumbnail': game.find('thumbnail').text
                },
        'is_cooperative': False if game.find('link[@id=\'2023\']') is None else True,
        'notes': notes,
    }
    wishlists_collection.insert_one(game_data)

    return jsonify({'message': 'Game added to the wishlist'}), 201