from flask import Blueprint, jsonify, render_template, request
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash

from .services.db import players_collection

#bp = Blueprint('main', __name__)
#
#@bp.route('/')
#def index():
#    return render_template('index.html')
#
#@bp.route('/games')
#def games():
#    # Dati fittizi per testare
#    games = [
#        {'name': 'Catan', 'category': 'Strategia', 'players': '3-4', 'average_time': 60},
#        {'name': 'Pandemic', 'category': 'Cooperativo', 'players': '2-4', 'average_time': 45},
#    ]
#    return render_template('games.html', games=games)


auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400

    # Check if the username already exists
    user = players_collection.find_one({'username': username})
    if user:
        return jsonify({'error': 'Username already exists'}), 400
    
    # Hash password and save the user
    user_data = {
        'username': username,
        'password': generate_password_hash(password)
    }
    players_collection.insert_one(user_data)

    # Generate the JWT token and return it
    access_token = create_access_token(identity=username)
    return jsonify({'access_token': access_token}), 201

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
    return jsonify({'access_token': access_token}), 200