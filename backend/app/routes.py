from datetime import datetime, timedelta
from dotenv import find_dotenv, load_dotenv
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
from .services.bgg_import import import_games_from_bgg

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
    #response.set_cookie('jwt_token', access_token, httponly=True, secure=True, max_age=timedelta(weeks=4)) # FIXME: use this in HTTPS environment
    response.set_cookie('jwt_token', access_token, httponly=True, secure=False, max_age=timedelta(weeks=4))    
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
    #response.set_cookie('jwt_token', access_token, httponly=True, secure=True, max_age=timedelta(weeks=4), samesite="None", partitioned=True) # FIXME: use this in HTTPS environment
    response.set_cookie('jwt_token', access_token, httponly=True, secure=False, max_age=timedelta(weeks=4), samesite="Lax")
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
        winner = [player for player in players]
        total_score = None
        worst_score_player = None
    else:
        # Check if the match is not cooperative --> the player with the highest score wins
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
    game_id = request.args.get('game_id')

    if not game_id:
        return jsonify({'error': 'Missing game_id'}), 400
    
    # Check if the game is in the wishlist
    game = wishlists_collection.find_one({'game_id': game_id})
    if not game:
        return jsonify({'error': 'Game not found in the wishlist'}), 404
    
    # Remove the game from the wishlist
    wishlists_collection.delete_one({'game_id': game_id})

    return jsonify({'message': 'Game removed from the wishlist'}), 200


@data_bp.route('/matchHistory', methods=['GET'])
@jwt_required()
def matchHistory():
    # Get all the matches from the database
    try:
        matches = matches_collection.find()
        
        matches_data = []

        for match in matches:
            match['_id'] = str(match['_id'])
            matches_data.append(match)

        return jsonify(matches_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
        matches = matches_collection.find({
            'date': {
                '$gte': start_date,
                '$lte': end_date
            }
        })
        
        total_hours = 0

        for match in matches:
            total_hours += match['game_duration']

        return jsonify(total_hours), 200
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
            matches = matches_collection.find({
                'date': {
                    '$gte': start_date,
                    '$lte': end_date
                }
            })
            
            total_matches = 0
    
            for match in matches:
                total_matches += 1
    
            return jsonify(total_matches), 200
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
        return jsonify(player['wins']), 200
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
                                "$and": [
                                    {"$eq": ["$$match.is_winner", True]},
                                    {"$gte": ["$$match.match_date", start_date]},
                                    {"$lte": ["$$match.match_date", end_date]}
                                ]
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

        return jsonify(total_wins), 200
                

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
        
        return jsonify(winrate), 200
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
                                "$and": [
                                    {"$gte": ["$$match.match_date", start_date]},
                                    {"$lte": ["$$match.match_date", end_date]}
                                ]
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

        result = players_collection.aggregate(pipeline)

        if result:
            winrate = result[0]["winrate"]
            return jsonify(winrate), 200
        else:
            return jsonify(0), 200

@statistic_bp.route('/playerLongWinstreak', methods=['GET'])
@jwt_required()
def playerLongWinstreak():

    # Get player name from query string
    player_name = request.args.get('username')

    # Check if the player name is provided otherwise use the logged user
    if not player_name:
        player_name = get_jwt_identity()

    player = players_collection.find_one({'username': player_name})

    return jsonify(player['winsteaks']), 200

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
        # 2. Filter matches by month and year
        {
            "$match": {
                "$expr": {
                    "$and": [
                        {"$eq": [{"$year": "$matches.match_date"}, year]},
                        {"$cond": {
                            "if": {"$ne": [month, None]},
                                "then": {"$eq": [{"$month": "$matches.match_date"}, month]},
                            "else": True
                        }}
                    ]
                }
            }
        },
        # 3. Group by username
        {
            "$group": {
                "_id": "$username",
                "total_matches": {"$sum": 1},
                "total_wins": {"$sum": {"$cond": [{"$eq": ["$matches.is_winner", True]}, 1, 0]}}
            }
        },
        # 4. Calculate the winrate
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
        # 5. Sort by winrate in descending order
        {
            "$sort": {
                "winrate": -1
            }
        },
        # 6. Limit to the first result
        {
            "$limit": 1
        }
    ]


    result = list(players_collection.aggregate(pipeline))

    if result:
        return jsonify(result[0]), 200
    else:
        return jsonify({'error': 'No matches found'}), 404

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
        return jsonify(result[0], result[-1]), 200
    
### GAME STATS ###

@statistic_bp.route('/gameCoopWinRate', methods=['GET'])
@jwt_required()
def gameCoopWinRate():

    # This route return the winrate of cooperative games for all the coop games in the collection
    
    # Calculate the win rate of cooperative matches for a specific game from game collection

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

    result = list(games_collection.aggregate(pipeline))

    if result:
        return jsonify(result), 200
    else:
        return jsonify({'error': 'No matches found'}), 404

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
            return jsonify(result[0], result[-1]), 200
        else:
            return jsonify({'error': 'No matches found'}), 404
        
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
                    "average_duration": {"$avg": "$matches.game_duration"}
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
        return jsonify(result), 200
    else:
        return jsonify({'error': 'No matches found'}), 404  


@statistic_bp.route('/gameBestValue', methods=['GET'])
@jwt_required()
def gameBestValue():

    # Get top 3 games with the best price/tot_hours_played ratio

    pipeline = [
        {
            '$unwind': '$matches'
        },
        {
            '$group': {
                '_id': '$bgg_id',
                'name': {'$first': '$name'},
                'price': {'$first': '$price'},
                'total_hours_played': {'$sum': '$matches.game_duration'}
            }
        },
        {
            '$project': {
                'name': 1,
                'price': 1,
                'price_per_hour': {'$cond': [
                    {'$gt': ['$total_hours_played', 0]}, 
                    {'$divide': ['$price', '$total_hours_played']},
                    0
                ]}
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
        return jsonify(result), 200
    else:
        return jsonify({'error': 'No matches found'}), 404
    
@statistic_bp.route('/gameHighestScore', methods=['GET'])
@jwt_required()
def gameHighestScore():
    # Get the game name from query string
    game_name = request.args.get('game_name')

    # Check if the game name is provided
    if not game_name:
        return jsonify({'error': 'Missing game name'}), 400
    
    game = games_collection.find_one({'name': game_name})

    if not game:
        return jsonify({'error': 'Game not found'}), 404

    return jsonify(game['record_score_by_player']), 200

@statistic_bp.route('/gameAvgScore', methods=['GET'])
@jwt_required()
def gameAvgScore():

    # Get the game name from query string
    game_name = request.args.get('game_name')

    # Check if the game name is provided
    if not game_name:
        return jsonify({'error': 'Missing game name'}), 400

    game = games_collection.find_one({'name': game_name})

    if not game:
        return jsonify({'error': 'Game not found'}), 404

    return jsonify(game['average_score']), 200

utility_bp = Blueprint('utils', __name__)

@utility_bp.route('/importGames', methods=['GET'])
@jwt_required()
def importGames():
    # Import games from BGG API using the bgg_import.py

    dotenv_path = find_dotenv()
    if dotenv_path:
        load_dotenv(dotenv_path, override=True)
    else:
        print("File .env non trovato")

    # Get the username from the .env file
    username = os.getenv('BGG_USERNAME')

    # Check if the username is provided
    if not username:
        return jsonify({'error': 'Missing BGG username'}), 400
    
    import_games_from_bgg(username)
    return jsonify({'message': 'Games imported successfully'}), 200