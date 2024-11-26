from datetime import datetime, timedelta
from flask import Blueprint, jsonify, render_template, request
from flask_jwt_extended import create_access_token, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash

from .services.db import players_collection, games_collection

#bp = Blueprint('main', __name__)


auth_bp = Blueprint('auth', __name__)

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
    response.set_cookie('jwt_token', access_token, httponly=True, secure=True, samesite='Strict', max_age=timedelta(weeks=4))
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
    response.set_cookie('jwt_token', access_token, httponly=True, secure=True, samesite='Strict', max_age=timedelta(weeks=4))
    return response, 200

# FIXME: logout route

data_bp = Blueprint('games', __name__)

# FIXME: use jwt_required decorator

@data_bp.route('/games', methods=['GET'])
def get_games():

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
def log_match():
    print(request.form)
    date = request.form.get('date')
    duration = request.form.get('duration')
    gameName = request.form.get('game')
    note = request.form.get('note')

    # Handle file upload
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    file = request.files['image']

    # Parse player data
    players = []
    index = 0
    while True:
        player_id = request.form.get(f'players[{index}][id]')
        player_score = request.form.get(f'players[{index}][score]')
        player_name = request.form.get(f'players[{index}][name]')
        if player_id is None:
            break
        players.append({'id': player_id, 'name': player_name, 'score': player_score})
        index += 1

    print(players)                                                     

    return jsonify({'message': 'Match logged successfully'}), 201






#image
#: 
#File
#lastModified
#: 
#1725828826650
#lastModifiedDate
#: 
#Sun Sep 08 2024 22:53:46 GMT+0200 (Ora legale dell’Europa centrale) {}
#name
#: 
#"herald.jpg"
#size
#: 
#463000
#type
#: 
#"image/jpeg"
#webkitRelativePath
#: 
#""
#[[Prototype]]
#: 
#File
#note
#: 
#"ghe"
#players
#: 
#Array(1)
#0
#: 
#id
#: 
#"6742610b5474817ef25e712f"
#name
#: 
#"aa"
#score
#: 
#78
#[[Prototype]]
#: 
#Object
#length
#: 
#1
#[[Prototype]]
#: 
#Array(0)
#[[Prototype]]
#: 
#Object