from datetime import datetime, timedelta
import traceback
from dotenv import find_dotenv, load_dotenv
from flask import Blueprint, jsonify, render_template, request, send_from_directory
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, decode_token
from jwt.exceptions import InvalidTokenError
from werkzeug.security import generate_password_hash, check_password_hash
import os
import uuid
from bson import ObjectId
from flask import current_app
import requests
import json

from .services.db import players_collection, games_collection, matches_collection, wishlists_collection, rulebooks_collection
from .services.bgg_import import import_games_from_bgg
from .services.achievements_management import check_update_achievements
from .services.achievements_setup import create_achievements

from .services.s3 import S3Client
from .services.rag import query_llm, query_index, display_search_results, initialize_pinecone, create_safe_namespace, index_single_pdf, clear_namespace


#embedding_model = initialize_embedding_model()
#index = initialize_pinecone()

if os.getenv('ENABLE_RAG') == 'True':
    index, embedding_provider = initialize_pinecone()

STORAGE_TYPE = os.getenv('STORAGE_TYPE')#'local'#'s3'

upload_folder = None

if STORAGE_TYPE in ['s3']:
    minio_client = S3Client.get_client()
elif STORAGE_TYPE in ['local']:
    # Create the upload folder if it doesn't exist
    upload_folder = current_app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/check-auth', methods=['GET'])
def check_auth():
    jwt_storage = os.getenv('JWT_STORAGE', 'cookie')
    
    token = None
    if jwt_storage == 'cookie':
        token = request.cookies.get('jwt_token')
    elif jwt_storage == 'localstorage':
        token = request.headers.get('Authorization')
        if token and token.startswith('Bearer '):
            token = token.split(' ')[1]
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
    email = data.get('mail')

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
        'matches': [],
        'wins': 0,
        'winstreak': 0,
        'longest_winstreak': 0,
        'losses': 0,
        'total_matches': 0,
        'num_competitive_win': 0,
    }
    players_collection.insert_one(user_data)

    # Generate the JWT token and return it
    access_token = create_access_token(identity=username)
    
    jwt_storage = os.getenv('JWT_STORAGE', 'cookie')


    if jwt_storage == 'cookie':
        response = jsonify({'message': 'Register successful'})
        response.set_cookie('jwt_token', access_token, httponly=True, secure=True, max_age=timedelta(weeks=4)) # FIXME: use this in HTTPS environment
        #response.set_cookie('jwt_token', access_token, httponly=True, secure=False, max_age=timedelta(weeks=4))    
    else:
        response = jsonify({'message': 'Register successful', 'jwt_token': access_token})
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
    
    jwt_storage = os.getenv('JWT_STORAGE')
    if jwt_storage == 'cookie':
        response = jsonify({'message': 'Login successful'})
        response.set_cookie('jwt_token', access_token, httponly=True, secure=True, max_age=timedelta(weeks=4), samesite="None", partitioned=True) # FIXME: use this in HTTPS environment
        #response.set_cookie('jwt_token', access_token, httponly=True, secure=False, max_age=timedelta(weeks=4), samesite="Lax")
    elif jwt_storage == 'localstorage':
        response = jsonify({'message': 'Login successful', 'jwt_token': access_token}) 
    return response, 200

# FIXME: logout route
@auth_bp.route('/logout', methods=['GET'])
@jwt_required()
def logout():
    response = jsonify({'message': 'Logout successful'})
    response.set_cookie('jwt_token', '', expires=0)
    return response, 200

data_bp = Blueprint('games', __name__)


@data_bp.route('/games', methods=['GET'])
@jwt_required()
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
    
@data_bp.route('/updateGames', methods=['POST'])
@jwt_required()
def update_games():
    data = request.get_json()
    game_id = data.get('game_id')
    isGifted = data.get('isGifted')
    game_price = data.get('price')

    if game_id:
        # Update the game in the database
        res = games_collection.update_one({'bgg_id': game_id}, {'$set': {'isGifted': isGifted, 'price': float(game_price)}})
        if res.modified_count:
            return jsonify({'message': 'Game updated successfully'}), 200
        else:
            return jsonify({'error': 'No modification applied'}), 400
    return jsonify({'error': 'Input not valid'}), 400



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
    date = request.form.get('date')
    duration = request.form.get('duration')
    game_name = request.form.get('game')
    game_id = request.form.get('game_id')
    note = request.form.get('note')
    isWin = request.form.get('isWin', '').strip().lower() in ['true', '1', 'yes']
    isTeamMatch = request.form.get('isTeamMatch', '').strip().lower() in ['true', '1', 'yes']
    winning_team = request.form.get('winningTeam')
    use_manual_winner = request.form.get('useManualWinner', '').strip().lower() in ['true', '1', 'yes']
    manual_winner_id = request.form.get('manualWinner')

    # Handle file upload
    image_file_name = None

    if 'image' in request.files:
        file = request.files['image']

        # Check if the file is empty
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        # Create a unique filename
        unique_file = f"{uuid.uuid4()}_{file.filename}"
        if STORAGE_TYPE in ['local']:
            image_file_name = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_file)
            file.save(image_file_name)
        elif STORAGE_TYPE in ['s3']:
             image_file_name = S3Client.put(
                file,
                unique_file,
                content_type=file.content_type
            )

    # Parse player data
    players = []
    index = 0
    while True:
        player_id = request.form.get(f'players[{index}][id]')
        # Check if the score is set, if not, assign null
        player_score = request.form.get(f'players[{index}][score]') or 0
        player_name = request.form.get(f'players[{index}][name]')
        player_team = request.form.get(f'players[{index}][team]') or None
        if player_id is None:
            break
        players.append({'id': player_id, 'name': player_name, 'score': int(player_score), 'team': player_team})
        index += 1
                                                  
    # Fill mongo collections

    # Compute winner, worst_score_player, is_cooperative, total_score

    game = games_collection.find_one({'bgg_id': game_id})
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    

    game_highest_score = game['record_score_by_player']['score']

    if (game['is_cooperative']):
        # Check if the match is cooperative --> each player wins
        winner = [player for player in players] if isWin else []
        total_score = None
        worst_score_player = None
    elif isTeamMatch and winning_team is not None:
        # Check if the match is a team match --> the team with the highest score wins
        winner = [player for player in players if player['team'] == winning_team]  # All players in the winning team
        total_score = None
        worst_score_player = None
    else:
        # Check if the match is not cooperative --> the player with the highest score wins
        if use_manual_winner and manual_winner_id is not None:
            # Use the manual winner if provided
            winner = next((player for player in players if player['id'] == manual_winner_id), None)
            total_score = None
            worst_score_player = None
        else:
            winner = max(players, key=lambda x: x['score'])
            total_score = sum([player['score'] for player in players])
            worst_score_player = min(players, key=lambda x: x['score'])

    # Create the match
    match_data = {
        'game_id': game_id,
        'game_name': game_name,
        'game_image': game['image']['url'],
        'date': date,
        'players': [player for player in players],
        'expansions_used': [],
        'notes': note,
        'game_duration': duration,
        'winner': winner,
        'worst_score_player': worst_score_player,
        'is_cooperative': game['is_cooperative'],
        'is_team_match': isTeamMatch,
        'total_score': total_score,
        'winning_team': winning_team,
        'use_manual_winner': use_manual_winner,
    }

    if image_file_name is not None:
        match_data['image'] = {
            'type' : STORAGE_TYPE,
            'filename' : image_file_name
        }

    result = matches_collection.insert_one(match_data)
    match_id = result.inserted_id 

    # Update players' stats


    for player in players:
        player_data = players_collection.find_one({'_id': ObjectId(player['id'])})
        player_data['total_matches'] += 1
        if game['is_cooperative'] and isWin:
            player_data['wins'] += 1
            player_data['winstreak'] += 1
        elif isTeamMatch and winning_team is not None and player['team'] == winning_team:
            player_data['wins'] += 1
            player_data['winstreak'] += 1
        elif not game['is_cooperative'] and not isTeamMatch and isinstance(winner, dict) and player['id'] == winner['id']:
            player_data['wins'] += 1
            player_data['num_competitive_win'] += 1
            player_data['winstreak'] += 1
        else:
            player_data['losses'] += 1
            player_data['winstreak'] = 0
        
        # Update player's longest winstreak
        if player_data['winstreak'] > player_data['longest_winstreak']:
            player_data['longest_winstreak'] = player_data['winstreak']

        # update player's match history
        player_data['matches'].append({
            'match_id': str(match_id),
            'game_id': game_id,
            'is_winner': (
                (game['is_cooperative'] and isWin) or  # Always True if coop and isWin
                (not game['is_cooperative'] and not isTeamMatch and isinstance(winner, dict) and player['id'] == winner['id']) or  # Competitive game, check player ID
                (isTeamMatch and winning_team is not None and player['team'] == winning_team)  # Team match, check team
            ),
            'score': player['score'],
            'date': date,
        })

        if player['score'] > game_highest_score:
            game['record_score_by_player'] = {
                'id': player['id'],
                'name': player['name'],
                'score': player['score'],
            }

        # update player's Collection
        players_collection.update_one({'_id': ObjectId(player['id'])}, {'$set': player_data})

    # Update game match history
    game['matches'].append({
        'match_id': str(match_id),
        'game_duration': duration,
        'total_score': total_score,
        'winner': winner,
    })

    # Loop over matches and update average score
    total_score = 0
    for match in game['matches']:
        if match['total_score'] is not None:
            total_score += match['total_score']
    game['average_score'] = total_score / len(game['matches'])

    # Update game's Collection
    games_collection.update_one({'bgg_id': game_id}, {'$set': game})

    # Check and update achievements
    player_ids = [player['id'] for player in players]
    check_update_achievements(player_ids, match_data)

    return jsonify({'message': 'Match logged successfully'}), 201

@data_bp.route('/wishlist', methods=['GET'])
@jwt_required()
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
@jwt_required()
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
    
    username = get_jwt_identity() #FIXME: uncomment this line
    #username = "bb"

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
        'added_at': datetime.now(),
    }
    wishlists_collection.insert_one(game_data)

    return jsonify({'message': 'Game added to the wishlist'}), 201

@data_bp.route('/removewishlist', methods=['DELETE'])
@jwt_required()
def remove_wishlist():
    # Get the bgg id from the query string
    data = request.get_json()
    game_id = data.get('game_id')

    if not game_id:
        return jsonify({'error': 'Missing game_id'}), 400
    
    # Check if the game is in the wishlist
    game = wishlists_collection.find_one({'game_id': game_id})
    if not game:
        return jsonify({'error': 'Game not found in the wishlist'}), 404
    
    # Remove the game from the wishlist
    wishlists_collection.delete_one({'game_id': game_id})

    return jsonify({'message': 'Game removed from the wishlist'}), 200

@auth_bp.route('/uploads/<path:filename>')
def uploaded_file(filename):
    try:
        # Send the file from the upload folder
        return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        return jsonify({'error': f"Failed to retrieve file: {str(e)}"}), 404

@data_bp.route('/matchHistory', methods=['GET'])
@jwt_required()
def matchHistory():
    # Get all the matches from the database
    try:
        matches = matches_collection.find()
        
        matches_data = []

        for match in matches:
            match['_id'] = str(match['_id'])
            if 'image' in match.keys():
                if match['image']['type'] in ['s3']:
                    match['image_url'] = S3Client.get_url_from_filename(match['image']['filename'])
                elif match['image']['type'] in ['local']:
                    filename = os.path.basename(match['image']['filename'])
                    match['image_url'] = f"/uploads/{filename}"

                del match['image']
                    
            matches_data.append(match)

        # Sort matches by date in descending order
        matches_data.sort(key=lambda x: (x['date'], x['_id']), reverse=True)

        return jsonify(matches_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@data_bp.route('/achievements', methods=['GET'])
@jwt_required()
def get_achievements():
    # Get the achievements for the spiecified player, the logged user by default
    # Get player name from query string
    player_name = request.args.get('username')

    # Check if the player name is provided otherwise use the logged user
    if not player_name:
        player_name = get_jwt_identity()

    # Find the player in the database
    player = players_collection.find_one({'username': player_name})
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    # Get the achievements from the player
    achievements = player.get('achievements', [])
   
    return jsonify(achievements), 200



statistic_bp = Blueprint('statistic', __name__)

### GLOBAL STATS ###

@statistic_bp.route('/totHours', methods=['GET'])
@jwt_required()
def totHours():

    # Get date filters from query string
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    # Check if the date filters are provided and validate them
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
    else:
        start_date = datetime(1970, 1, 1) # Default start date
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
    else:
        end_date = datetime.now()

    try:
        # Find matches in the date range
        pipeline = [
            {
                '$addFields': {
                    'date_obj': {
                        '$dateFromString': {
                            'dateString': '$date',
                            'format': '%Y-%m-%d'
                        }
                    }
                }
            },
            {
                '$match': {
                    'date_obj': {
                        '$gte': start_date,
                        '$lte': end_date
                    }
                }
            },
            {
                '$group': {
                    '_id': None,
                    'total_hours': {
                        '$sum': {
                            '$toInt': '$game_duration'  # Convert string to integer before summing
                        }
                    }
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'total_hours': {  # Divide total minutes by 60 to get hours
                        '$divide': ['$total_hours', 60]
                    }
                }
            }
        ]

        result = list(matches_collection.aggregate(pipeline))


        if result:
            total_hours = round(result[0]['total_hours'], 2)
        else:
            total_hours = 0


        return jsonify({
            "type": "number",
            "value": total_hours,
            "unit": "hours",
            "description": "Total hours played between " + start_date.strftime('%Y-%m-%d') + " and " + end_date.strftime('%Y-%m-%d')
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@statistic_bp.route('/totMatches', methods=['GET'])
@jwt_required()
def totMatches():
    
        # Get date filters from query string
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
    
        # Check if the date filters are provided and validate them
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
        else:
            start_date = datetime(1970, 1, 1) # Default start date
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
        else:
            end_date = datetime.now()
        
        try:
            # Find matches in the date range

            pipeline = [
                {
                    '$addFields': {
                        'date_obj': {
                            '$dateFromString': {
                                'dateString': '$date',
                                'format': '%Y-%m-%d'
                            }
                        }
                    }
                },
                {
                    '$match': {
                        'date_obj': {
                            '$gte': start_date,
                            '$lte': end_date
                        }
                    }
                }
            ]

            #result = list(matches_collection.aggregate(pipeline))
            
            total_matches = len(list(matches_collection.aggregate(pipeline)))
    
            
    
            return jsonify({
                "type": "number",
                "value": total_matches,
                "unit": "matches",
                "description": "Total matches played between " + start_date.strftime('%Y-%m-%d') + " and " + end_date.strftime('%Y-%m-%d')
            }), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
### PLAYER STATS ###

@statistic_bp.route('/playerWins', methods=['GET'])
@jwt_required()
def playerWins():
        
    # Get date filters from query string
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    # Get player name from query string
    player_name = request.args.get('username')

    # Check if the player name is provided otherwise use the logged user
    if not player_name:
        player_name = get_jwt_identity()
    
    # Check if the date filters are provided and validate them
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400

    player = players_collection.find_one({'username': player_name})
    if start_date_str is None and end_date_str is None:
        # Read from player's collection
        return jsonify({
            "type": "number",
            "value": player['wins'],
            "unit": "wins",
            "description": "Total wins of player " + player_name
        }), 200
    else:

        # Set default values for start_date and end_date if not provided
        if start_date_str is None:
            start_date = datetime(1970, 1, 1)
        if end_date_str is None:
            end_date = datetime.now()

        # Find matches in the date range from the player's collection where the player is the winner
        pipeline = [
            {
                "$match": {
                    "username": player_name
                }
            },
            {
                "$project": {
                    "matches": {
                        "$filter": {
                            "input": "$matches",
                            "as": "match",
                            "cond": {
                                "$let": {
                                    "vars": {
                                        # Convert the string date to a date object
                                        "match_date_obj": {
                                            "$dateFromString": {
                                                "dateString": "$$match.date", # Use the correct field name ('date')
                                                "format": "%Y-%m-%d",
                                                "onError": None, # Return null if conversion fails
                                                "onNull": None   # Return null if date string is null
                                            }
                                        }
                                    },
                                    "in": {
                                        "$and": [
                                            {"$ne": ["$$match_date_obj", None]}, # Ensure conversion was successful
                                            {"$eq": ["$$match.is_winner", True]},
                                            {"$gte": ["$$match_date_obj", start_date]}, # Compare date objects
                                            {"$lte": ["$$match_date_obj", end_date]}   # Compare date objects
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                "$unwind": "$matches"
            },
            {
                "$count": "total_wins"
            }
        ]

        result = list(players_collection.aggregate(pipeline))

        if result:
            total_wins = result[0]["total_wins"]
        else:
            total_wins = 0

        return jsonify({
            "type": "number",
            "value": total_wins,
            "unit": "wins",
            "description": "Total wins of player " + player_name + " between " + start_date.strftime('%Y-%m-%d') + " and " + end_date.strftime('%Y-%m-%d')
        }), 200
                

@statistic_bp.route('/playerWinRate', methods=['GET'])
@jwt_required()
def playerWinRate():

    # Get date filters from query string
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    # Get player name from query string
    player_name = request.args.get('username')

    # Check if the player name is provided otherwise use the logged user
    if not player_name:
        player_name = get_jwt_identity()
    
    # Check if the date filters are provided and validate them
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400

    player = players_collection.find_one({'username': player_name})

    if start_date_str is None and end_date_str is None:
        # Read from player's collection, prevent division by zero
        if player['total_matches'] > 0:
            winrate = (player['wins'] / player['total_matches']) * 100
        else:
            winrate = 0
        
        return jsonify({
            "type": "percentage",
            "value": winrate,
            "unit": "%",
            "description": "Winrate of player " + player_name
        }), 200
    else:
        
        # Set default values for start_date and end_date if not provided
        if start_date_str is None:
            start_date = datetime(1970, 1, 1)
        if end_date_str is None:
            end_date = datetime.now()

        # Calculate the win rate over a period of time from the player's collection

        # Find matches in the date range from the player's collection

        pipeline = [
            # 1. Filter the player by username
            {
                "$match": {
                    "username": player_name
                }
            },
            # 2. Filter matches by date range
            {
                "$project": {
                    "matches": {
                        "$filter": {
                            "input": "$matches",
                            "as": "match",
                            "cond": {
                                "$let": {  # Use $let to define a temporary variable
                                    "vars": {
                                        "match_date_obj": {
                                            "$dateFromString": {
                                                "dateString": "$$match.date", # Convert the date string
                                                "format": "%Y-%m-%d",
                                                "onError": None,
                                                "onNull": None
                                            }
                                        }
                                    },
                                    "in": {
                                        "$and": [
                                            {"$ne": ["$$match_date_obj", None]}, # Ensure conversion was successful
                                            {"$gte": ["$$match_date_obj", start_date]}, # Compare date objects
                                            {"$lte": ["$$match_date_obj", end_date]}   # Compare date objects
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            # 3. Unwind the matches array
            {
                "$unwind": "$matches"
            },
            # 4. Group by the player (or any field, since we're calculating a total)
            {
                "$group": {
                    "_id": None,  # We don't need a specific group key
                    "total_matches": {"$sum": 1},
                    "total_wins": {"$sum": {"$cond": [{"$eq": ["$matches.is_winner", True]}, 1, 0]}}
                }
            },
            # 5. Calculate the winrate
            {
                "$project": {
                    "total_matches": 1,
                    "total_wins": 1,
                    "winrate": {
                        "$cond": [
                            {"$gt": ["$total_matches", 0]},
                            {"$multiply": [{"$divide": ["$total_wins", "$total_matches"]}, 100]},
                            0  # If no matches, winrate is 0
                        ]
                    }
                }
            }
        ]

        result = list(players_collection.aggregate(pipeline))

        if result:
            winrate = result[0]["winrate"]
            return jsonify({
                "type": "percentage",
                "value": winrate,
                "unit": "%",
                "description": "Winrate of player " + player_name + " between " + start_date.strftime('%Y-%m-%d') + " and " + end_date.strftime('%Y-%m-%d')
            }), 200
        else:
            return jsonify({
                "type": "percentage",
                "value": 0,
                "unit": "%",
                "description": "Winrate of player " + player_name + " between " + start_date.strftime('%Y-%m-%d') + " and " + end_date.strftime('%Y-%m-%d')
            }), 200

@statistic_bp.route('/playerLongWinstreak', methods=['GET'])
@jwt_required()
def playerLongWinstreak():

    # Get player name from query string
    player_name = request.args.get('username')

    # Check if the player name is provided otherwise use the logged user
    if not player_name:
        player_name = get_jwt_identity()

    player = players_collection.find_one({'username': player_name})

    return jsonify({
        "type": "number",
        "value": player['longest_winstreak'],
        "unit": "matches",
        "description": "Longest win streak of player " + player_name
    }), 200

@statistic_bp.route('/playerHighestWinRate', methods=['GET'])
@jwt_required()
def playerHighestWinRate():
        
    # Get month and year from query string
    month = request.args.get('month')
    year = request.args.get('year')

    # Check if the month and year are provided and validate them
    if month:
        try:
            month = int(month)
        except ValueError:
            return jsonify({'error': 'Invalid month format. Use an integer'}), 400
    if year:
        try:
            year = int(year)
        except ValueError:
            return jsonify({'error': 'Invalid year format. Use an integer'}), 400
    else:
        year = datetime.now().year
    
    if month is not None and (month < 1 or month > 12):
        return jsonify({'error': 'Invalid month. Use a number between 1 and 12'}), 400
    
    if year < 1970 or year > datetime.now().year:
        return jsonify({'error': 'Invalid year. Use a number between 1970 and the current year'}), 400
    
    # Calculate the player with the highest win rate in a specific month and year from player collection

    # Find matches in the date range from the player's collection

    pipeline = [
        # 1. Unwind the matches array
        {
            "$unwind": "$matches"
        },
        # 2. Add a field for the converted date object
        {
            "$addFields": {
                "matches.match_date_obj": {
                    "$dateFromString": {
                        "dateString": "$matches.date", # Convert the string date field
                        "format": "%Y-%m-%d",
                        "onError": None, # Handle conversion errors
                        "onNull": None   # Handle null dates
                    }
                }
            }
        },
        # 3. Filter matches by month and year
        {
            "$match": {
                # Ensure the date conversion was successful
                "matches.match_date_obj": {"$ne": None},
                # Apply year and month filters using $expr
                "$expr": {
                    "$and": [
                        # Compare the year of the converted date object
                        {"$eq": [{"$year": "$matches.match_date_obj"}, year]},
                        # Conditionally compare the month if 'month' is provided
                        {"$cond": {
                            "if": {"$ne": [month, None]},
                            "then": {"$eq": [{"$month": "$matches.match_date_obj"}, month]},
                            "else": True # If month is None, this condition is always true
                        }}
                    ]
                }
            }
        },
        # 4. Group by username
        {
            "$group": {
                "_id": "$username",
                "total_matches": {"$sum": 1},
                "total_wins": {"$sum": {"$cond": [{"$eq": ["$matches.is_winner", True]}, 1, 0]}}
            }
        },
        # 5. Calculate the winrate
        {
            "$project": {
                "username": "$_id",
                "total_matches": 1,
                "total_wins": 1,
                "winrate": {
                    "$cond": [
                        {"$gt": ["$total_matches", 0]},
                        {"$multiply": [{"$divide": ["$total_wins", "$total_matches"]}, 100]},
                        0
                    ]
                }
            }
        },
        # 6. Sort by winrate in descending order
        {
            "$sort": {
                "winrate": -1
            }
        },
        # 7. Limit to the first result
        {
            "$limit": 1
        }
    ]


    result = list(players_collection.aggregate(pipeline))

    if result:
        return jsonify({
            "type": "percentage",
            "value": result[0]['winrate'],
            "unit": "%",
            "description": "Player with the highest winrate in " + str(month) + "/" + str(year) + ": " + result[0]['username'],
            "deatils": {
                "username": result[0]['username'],
                "total_matches": result[0]['total_matches'],
                "total_wins": result[0]['total_wins']
            }
        }), 200
    else:
        return jsonify({
            "type": "percentage",
            "value": 0,
            "unit": "%",
            "description": "No matches found for the specified month and year.",
            "deatils": {}
        }), 200

@statistic_bp.route('/playerGameWins', methods=['GET'])
@jwt_required()
def playerGameWins():

    # Get player name from query string
    player_name = request.args.get('username')

    # Check if the player name is provided otherwise use the logged user
    if not player_name:
        player_name = get_jwt_identity()
    
    # Calculate the game with most wins and with least wins from player collection

    pipeline = [
        # 1. Filter the player by username
        {
            "$match": {
                "username": player_name
            }
        },
        # 2. Unwind the matches array
        {
            "$unwind": "$matches"
        },
        # 3. Group by game_id
        {
            "$group": {
                "_id": "$matches.game_id",
                "total_wins": {"$sum": {"$cond": [{"$eq": ["$matches.is_winner", True]}, 1, 0]}}
            }
        },
        # 4. Sort by total_wins in descending order
        {
            "$sort": {
                "total_wins": -1
            }
        }
    ]

    result = list(players_collection.aggregate(pipeline))

    if result:
        # Get the games' names from the game collection
        best_game = games_collection.find_one({"bgg_id": result[0]["_id"]})
        worst_game = games_collection.find_one({"bgg_id": result[-1]["_id"]})
        
        best_game_name = best_game["name"] if best_game else "Unknown"
        worst_game_name = worst_game["name"] if worst_game else "Unknown"
        return jsonify({
            "type": "comparison",
            "value": [
                {
                    "name": best_game_name,
                    "game_id": result[0]["_id"],
                    "total_wins": result[0]["total_wins"],
                    "status": "best"
                },
                {
                    "name": worst_game_name,
                    "game_id": result[-1]["_id"],
                    "total_wins": result[-1]["total_wins"],
                    "status": "worst"
                }
            ],
            "unit": "wins",
            "description": "Best and worst game played by player " + player_name
        }), 200
    else: 
        return jsonify({
            "type": "comparison",
            "value": [],
            "unit": "wins",
            "description": "No matches found for player " + player_name,
        }), 404
    
### GAME STATS ###

@statistic_bp.route('/gameCoopWinRate', methods=['GET'])
@jwt_required()
def gameCoopWinRate():

    # This route return the winrate of cooperative games for all the coop games in the collection if no game_id is provided
    
    # Calculate the win rate of cooperative matches for a specific game from game collection

    game_name = request.args.get('game_name')

    if not game_name:
        pipeline = [
            # 1. Filter the games by is_cooperative
            {
                "$match": {
                    "is_cooperative": True
                }
            },
            # 2. Unwind the matches array
            {
                "$unwind": "$matches"
            },
            # 3. Group by game_id
            {
                "$group": {
                    "_id": "$bgg_id",
                    "total_matches": {"$sum": 1},
                    "total_wins": {"$sum": {"$cond": [ {"$gt": [{"$size": "$matches.winner"}, 0]},
                            1,
                            0]}}
                }
            },
            # 4. Calculate the winrate
            {
                "$project": {
                    "game_id": "$_id",
                    "total_matches": 1,
                    "total_wins": 1,
                    "winrate": {
                        "$cond": [
                            {"$gt": ["$total_matches", 0]},
                            {"$multiply": [{"$divide": ["$total_wins", "$total_matches"]}, 100]},
                            0
                        ]
                    }
                }
            },
            # 5. Sort by winrate in descending order
            {
                "$sort": {
                    "winrate": -1
                }
            },
            # 6. Limit to the top 5
            {
                "$limit": 5
            }
        ]
    else: 
        pipeline = [
            # 1. Filter the games by game_name
            {
                "$match": {
                    "name": game_name,
                    "is_cooperative": True
                }
            },
            # 2. Unwind the matches array
            {
                "$unwind": "$matches"
            },
            # 3. Group by game_id
            {
                "$group": {
                    "_id": "$bgg_id",
                    "total_matches": {"$sum": 1},
                    "total_wins": {"$sum": {"$cond": [ {"$gt": [{"$size": "$matches.winner"}, 0]},
                            1,
                            0]}}
                }
            },
            # 4. Calculate the winrate
            {
                "$project": {
                    "game_id": "$_id",
                    "total_matches": 1,
                    "total_wins": 1,
                    "winrate": {
                        "$cond": [
                            {"$gt": ["$total_matches", 0]},
                            {"$multiply": [{"$divide": ["$total_wins", "$total_matches"]}, 100]},
                            0
                        ]
                    }
                }
            }
        ]

    result = list(games_collection.aggregate(pipeline))

    if result:
        for game in result:
            game_data = games_collection.find_one({"bgg_id": game["game_id"]})
            game["name"] = game_data["name"] if game_data else "Unknown"
            # Remove the game_id from the result
            del game["game_id"]
        
        return jsonify({
            "type": "list",
            "value": result,
            "description": "Top 5 cooperative games winrate"
        }), 200
    else:
        return jsonify({
            "type": "list",
            "value": [],
            "description": "No cooperative games found"
        }), 200

@statistic_bp.route('/gameNumMatch', methods=['GET'])
@jwt_required()
def gameNumMatch():    
        # Calculate the number of matches for a specific game from game collection
    
        pipeline = [
            # 1. Unwind the matches array
            {
                "$unwind": "$matches"
            },
            # 2. Group by game_id
            {
                "$group": {
                    "_id": "$bgg_id",
                    "total_matches": {"$sum": 1}
                }
            },
            # 3. Sort by total_matches in descending order
            {
                "$sort": {
                    "total_matches": -1
                }
            }
        ]
    
        result = list(games_collection.aggregate(pipeline))
    
        if result:

            # Get the games' names from the game collection
            most_played = games_collection.find_one({"bgg_id": result[0]["_id"]})
            least_played = games_collection.find_one({"bgg_id": result[-1]["_id"]})
            
            most_played_name = most_played["name"] if most_played else "Unknown"
            least_played_name = least_played["name"] if least_played else "Unknown"
        

            return jsonify({
                "type": "comparison",
                "value": [
                    {
                        "name": most_played_name,
                        "game_id": result[0]["_id"],
                        "total_matches": result[0]["total_matches"],
                        "status": "most"
                    },
                    {
                        "name": least_played_name,
                        "game_id": result[-1]["_id"],
                        "total_matches": result[-1]["total_matches"],
                        "status": "least"
                    }
                ],
                "description": "Most and least played games",
            }), 200
        else:
            return jsonify({
                "type": "comparison",
                "value": [],
                "description": "No matches found",
            }), 200
        
@statistic_bp.route('/gameAvgDuration', methods=['GET'])
@jwt_required()
def gameAvgDuration():

    # Get game from query string
    game_name = request.args.get('game_name')

    if not game_name:
        # Retourn the top 3 games with the highest average duration
        pipeline = [
            # 1. Unwind the matches array
            {
                "$unwind": "$matches"
            },
            # 2. Group by game_id
            {
                "$group": {
                    "_id": "$bgg_id",
                    "average_duration": {"$avg": {"$toInt": "$matches.game_duration"}}
                }
            },
            # 3. Sort by average_duration in descending order
            {
                "$sort": {
                    "average_duration": -1
                }
            },
            # 4. Limit to the top 3
            {
                "$limit": 3
            }
        ]
    else:
        pipeline = [
            # 1. Filter the games by game_name
            {
                "$match": {
                    "name": game_name
                }
            },
            # 2. Unwind the matches array
            {
                "$unwind": "$matches"
            },
            # 3. Group by game_id
            {
                "$group": {
                    "_id": "$bgg_id",
                    "average_duration": {"$avg": "$matches.game_duration"}
                }
            }
        ]
    
    result = list(games_collection.aggregate(pipeline))

    if result:
        # Add game names to results
        for game in result:
            game_data = games_collection.find_one({"bgg_id": game["_id"]})
            game["name"] = game_data["name"] if game_data else "Unknown"

        if game_name:
            return jsonify({
                "type": "number",
                "value": result[0]["average_duration"],
                "unit": "hours",
                "description": f"Average duration for {game_name}"
            }), 200
        else:
            return jsonify({
                "type": "list",
                "value": result,
                "description": "Games with longest average duration"
            }), 200
    else:
        return jsonify({
            "type": "number",
            "value": 0,
            "unit": "hours",
            "description": f"No data available for {game_name if game_name else 'any game'}"
        }), 200


@statistic_bp.route('/gameBestValue', methods=['GET'])
@jwt_required()
def gameBestValue():

    # Get top 3 games with the best price/tot_hours_played ratio

    pipeline = [
        {
            '$match': { # Filter out documents where price is null or doesn't exist
                'price': {'$ne': None, '$exists': True},
                'isGifted': {'$ne': True} # Exclude gifted games
            }
        },
        {
            '$unwind': '$matches'
        },
        {
            '$group': {
                '_id': '$bgg_id',
                'name': {'$first': '$name'},
                'price': {'$first': '$price'},
                'total_minutes_played': {'$sum': {"$toInt":'$matches.game_duration'}}
            }
        },
        {
            '$addFields': {
                 # Calculate total hours played
                'total_hours_played': {'$divide': ['$total_minutes_played', 60]}
            }
        },
        {
            '$project': {
                'name': 1,
                'price': 1,
                'price_per_hour': {'$cond': [
                    {'$gt': ['$total_hours_played', 0]}, 
                    {'$round': [{'$divide': ['$price', '$total_hours_played']}, 2]},
                    None
                ]}
            }
        },
        {
           '$match': { # Filter out results where price_per_hour couldn't be calculated (e.g., 0 hours)
               'price_per_hour': {'$ne': None}
           }
        },
        {
            '$sort': {'price_per_hour': 1}
        },
        {
            '$limit': 3
        }
    ]

    result = list(games_collection.aggregate(pipeline))

    if result:
        return jsonify({
            "type": "list",
            "value": result,
            "description": "Top 3 games with the best price/tot_hours_played ratio"
        }), 200
    else:
        return jsonify({
            "type": "list",
            "value": [],
            "description": "No games found"
        }), 200
    
@statistic_bp.route('/gameHighestScore', methods=['GET'])
@jwt_required()
def gameHighestScore():
    # Get the game name from query string
    game_name = request.args.get('game_name')

    # Check if the game name is provided
    if not game_name:
        return jsonify({
            "type": "number",
            "value": 0,
            "unit": "points",
            "description": "Missing game name"
        }), 200
    
    game = games_collection.find_one({'name': game_name})

    if not game:
        return jsonify({
            "type": "number",
            "value": 0,
            "unit": "points",
            "description": f"Game {game_name} not found"
        }), 200

    return jsonify({
        "type": "number",
        "value": game['record_score_by_player']['score'],
        "unit": "points",
        "description": f"Highest score for {game_name} is {game['record_score_by_player']['score']} points by {game['record_score_by_player']['name']}",
        "details": {
            "player": game['record_score_by_player']['name'],
            "player_id": game['record_score_by_player']['id']
        }
    }), 200

@statistic_bp.route('/gameAvgScore', methods=['GET'])
@jwt_required()
def gameAvgScore():

    # Get the game name from query string
    game_name = request.args.get('game_name')

    # Check if the game name is provided
    if not game_name:
        return jsonify({
            "type": "number",
            "value": 0,
            "unit": "points",
            "description": "Missing game name"
        }), 200
    
    game = games_collection.find_one({'name': game_name})

    if not game:
        return jsonify({
            "type": "number",
            "value": 0,
            "unit": "points",
            "description": f"Game {game_name} not found"
        }), 200

    return jsonify({
        "type": "number",
        "value": round(game['average_score'], 2),
        "unit": "points",
        "description": f"Average score for {game_name} is {round(game['average_score'], 2)} points"
    }), 200

utility_bp = Blueprint('utils', __name__)

@utility_bp.route('/importGames', methods=['GET'])
@jwt_required()
def importGames():
    # Import games from BGG API using the bgg_import.py

    # Get the username from the .env file
    username = os.getenv('BGG_USERNAME')

    # Check if the username is provided
    if not username:
        return jsonify({'error': 'Missing BGG username'}), 400
    
    import_games_from_bgg(username)
    return jsonify({'message': 'Games imported successfully'}), 200

@utility_bp.route('/setupAchievements', methods=['GET'])
@jwt_required()
def setupAchievements():
    create_achievements()
    return jsonify({'message': 'Achievements created successfully'}), 200

rulebooks_bp = Blueprint('rulebooks', __name__)

@rulebooks_bp.route('/rulebooks', methods=['GET'])
@jwt_required()
def get_rulebooks():
    try:
        # Get all rulebooks from database
        rulebooks = rulebooks_collection.find()
        
        rulebooks_data = []
        for rulebook in rulebooks:
            rulebook['_id'] = str(rulebook['_id'])
            rulebooks_data.append(rulebook)
            
        return jsonify(rulebooks_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rulebooks_bp.route('/upload-rulebook', methods=['POST'])
@jwt_required()
def upload_rulebook():
    try:
        # Get current user
        current_user = get_jwt_identity()
        
        # Check if PDF file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        # Check if file is PDF
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'File must be PDF'}), 400
            
        # Get game information
        game_id = request.form.get('game_id')
        game_name = request.form.get('game_name')
        
        # Create unique filename
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        
        # Always use S3 for rulebooks
        if STORAGE_TYPE == 's3':
            # Save file to S3
            S3Client.put(file, unique_filename, content_type='application/pdf')
            file_url = S3Client.get_url_from_filename(unique_filename)
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file_path = temp_file.name
                
            # Download from S3 to temp file
            S3Client.download(unique_filename, temp_file_path)
            
            index_single_pdf(file.filename, index, embedding_provider, temp_file_path)

            # Clean up
            os.remove(temp_file_path)
        else:
            # Save file locally as fallback
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)
            file_url = f"/uploads/{unique_filename}"
            index_single_pdf(file.filename, index, embedding_provider, file_path)
            
        # Save rulebook info to database
        rulebook_data = {
            'filename': file.filename,
            'file_url': file_url,
            'game_id': game_id,
            'game_name': game_name,
            'uploaded_by': current_user,
            'uploaded_at': datetime.now(),
            'original_uploader': current_user
        }
        
        rulebooks_collection.insert_one(rulebook_data)
        
        return jsonify({'message': 'Rulebook uploaded successfully', 'file_url': file_url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rulebooks_bp.route('/rulebook/<rulebook_id>', methods=['DELETE'])
@jwt_required()
def delete_rulebook(rulebook_id):
    try:
        # Get current user
        current_user = get_jwt_identity()
        
        # Find rulebook
        rulebook = rulebooks_collection.find_one({'_id': ObjectId(rulebook_id)})
        
        if not rulebook:
            return jsonify({'error': 'Rulebook not found'}), 404
            
        # Check if user is the one who uploaded the rulebook
        if rulebook['uploaded_by'] != current_user:
            return jsonify({'error': 'Unauthorized to delete this rulebook'}), 403
            
        # Delete from database
        rulebooks_collection.delete_one({'_id': ObjectId(rulebook_id)})
        
        clear_namespace(index, create_safe_namespace(rulebook['filename']))

        # Delete the actual file based on storage type
        if STORAGE_TYPE == 'local':
            filename = os.path.basename(rulebook['file_url'])
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        elif STORAGE_TYPE == 's3':
            file_url = rulebook['file_url']
            if file_url:
                filename = file_url.split('/')[-1]
                S3Client.delete(filename)
                
        return jsonify({'message': 'Rulebook deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rulebooks_bp.route('/rulebook/<rulebook_id>', methods=['GET'])
@jwt_required()
def get_rulebook(rulebook_id):
    try:
        # Find rulebook
        rulebook = rulebooks_collection.find_one({'_id': ObjectId(rulebook_id)})
        
        if not rulebook:
            return jsonify({'error': 'Rulebook not found'}), 404
            
        # Convert ObjectId to string
        rulebook['_id'] = str(rulebook['_id'])
        
        return jsonify(rulebook), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rulebooks_bp.route('/rulebook-chat', methods=['POST'])
@jwt_required()
def rulebook_chat():
    try:
        # Get current user
        current_user = get_jwt_identity()
        
        # Get query and rulebook ID from request
        data = request.json
        query = data.get('query')
        rulebook_id = data.get('rulebook_id')
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
        
        if not rulebook_id:
            return jsonify({'error': 'No rulebook ID provided'}), 400
        
        # Find rulebook
        rulebook = rulebooks_collection.find_one({'_id': ObjectId(rulebook_id)})
        
        if not rulebook:
            return jsonify({'error': 'Rulebook not found'}), 404
        
        # Import the RAG functionality
        
        
        # Get the safe namespace for the rulebook (filename without extension)
        filename = rulebook.get('filename', '')
        namespace = create_safe_namespace(filename)
        
        # Initialize embedding model and Pinecone
        #embedding_model = initialize_embedding_model()
        #index = initialize_pinecone()
        
        # Query Pinecone
        top_matches = query_index(query, [namespace], index, embedding_provider)
        
        # No matches found
        if not top_matches:
            response_payload = {
                'answer': "I couldn't find any relevant information in this rulebook to answer your question. Please try rephrasing your query or check if this rulebook contains information about this topic.",
                'page_refs': []
            }
            
            # Include context only if requested
            include_context = data.get('include_context', False)
            if include_context:
                response_payload['context'] = ""
                
            return jsonify(response_payload), 200
        
        # Process the results
        context, page_refs = display_search_results(top_matches)
        
        # Ensure page_refs are properly serializable
        serializable_page_refs = []
        for ref in page_refs:
            serializable_page_refs.append({
                "page": str(ref["page"]),
                "file": str(ref["file"])
            })
        
        # Ensure context is a string
        if not isinstance(context, str):
            context = str(context)
        
        # Query the LLM
        answer = query_llm(query, context, page_refs)
        
        # Ensure answer is a string
        if not isinstance(answer, str):
            answer = str(answer)
        
        # Create a response payload with only JSON-serializable types
        response_payload = {
            'answer': answer,
            # Only include context if explicitly requested with include_context=true
            'page_refs': serializable_page_refs
        }
        
        # Include context only if requested
        include_context = data.get('include_context', False)
        if include_context:
            response_payload['context'] = context
        
        # Convert to JSON string and back to dict to ensure all objects are serializable
        try:
            import json
            response_json = json.dumps(response_payload)
            response_payload = json.loads(response_json)
        except TypeError as e:
            print(f"JSON serialization error: {str(e)}")
            # Fallback response if serialization fails
            response_payload = {
                'answer': "I processed your query but encountered an error formatting the response. Please try again.",
                'page_refs': []
            }
            if include_context:
                response_payload['context'] = ""
        
        return jsonify(response_payload), 200
        
    except Exception as e:
        error_message = str(e)
        print(f"Error in rulebook chat: {error_message}")
        
        # Add more detailed debugging
        import traceback
        traceback.print_exc()
        
        # Try to identify the problematic object type
        if "is not JSON serializable" in error_message:
            try:
                import inspect
                print(f"Attempting to identify non-serializable object...")
                if "page_refs" in locals():
                    print(f"page_refs type: {type(page_refs)}")
                    if page_refs and len(page_refs) > 0:
                        print(f"First page_ref item type: {type(page_refs[0])}")
                if "context" in locals():
                    print(f"context type: {type(context)}")
                if "answer" in locals():
                    print(f"answer type: {type(answer)}")
            except Exception as debug_error:
                print(f"Error during debugging: {str(debug_error)}")
        
        return jsonify({
            'error': error_message, 
            'message': 'An error occurred while processing your request'
        }), 500
    
scoresheets_bp = Blueprint('scoreSheet', __name__)

@scoresheets_bp.route('/scoreSheets', methods=['GET'])
@jwt_required()
def get_score_sheets():
    try:
        # Get all scoresheets from the folder
        scoresheets = [f for f in os.listdir("../scoresheets") if f.endswith('.json')]
        # Get only the game name --> remove the _score_sheet.json
        scoresheets = [f.replace('_score_sheet.json', '') for f in scoresheets]
        return jsonify(scoresheets), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scoresheets_bp.route('/scoreSheet/<sheet_name>', methods=['GET'])
@jwt_required()
def get_score_sheet(sheet_name):
    try:

        filename = f"{sheet_name}_score_sheet.json"
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        SCORESHEETS_DIR = os.path.join(BASE_DIR, "scoresheets")
        file_path = os.path.join(SCORESHEETS_DIR, filename)


        if not os.path.exists(file_path):
            return jsonify({'error': 'Score sheet not found'}), 404
        
        return send_from_directory(SCORESHEETS_DIR, filename, mimetype='application/json')

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@scoresheets_bp.route('/upload-scoreSheet', methods=['POST'])
@jwt_required()
def upload_score_sheet():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No scoresheet provided'}), 400

        game_name = data.get('game_name')
        if not game_name:
            return jsonify({'error': 'No game name provided'}), 400
        
        file_name = f"{game_name}_score_sheet.json"
        
        # Save file locally as fallback
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        SCORESHEETS_DIR = os.path.join(BASE_DIR, "scoresheets")

        if not os.path.exists(SCORESHEETS_DIR):
            os.makedirs(SCORESHEETS_DIR)

        file_path = os.path.join(SCORESHEETS_DIR, file_name)
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)

        return jsonify({'message': 'Score sheet uploaded successfully', 'file_url': f"/scoresheets/{file_name}"}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
