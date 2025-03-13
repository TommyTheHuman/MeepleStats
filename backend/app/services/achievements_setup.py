import os
import uuid

from flask import current_app
from werkzeug.datastructures import FileStorage

from .s3 import S3Client
from .db import achievements_collection

def create_achievements():

  STORAGE_TYPE = os.getenv('STORAGE_TYPE')#'local'#'s3'

  upload_folder = None
  if STORAGE_TYPE in ['local']:
      # Create the upload folder if it doesn't exist
      upload_folder = current_app.config['UPLOAD_FOLDER']
      if not os.path.exists(upload_folder):
          os.makedirs(upload_folder)

  achievements = [
    {
      "_id": "veteran",
      "name": "Veteran",
      "description": "Played a total of 25, 50, or 100 matches.",
      "badges": {
        "bronze": "uploads/veteran_bronze.png",
        "silver": "uploads/veteran_silver.png",
        "gold": "uploads/veteran_gold.png"
      },
      "criteria": { 
         "type": "total_matches", 
         "levels": {
            "bronze": 25,
            "silver": 50,
            "gold": 100
         }
     }
    },
    {
      "_id": "unstoppable",
      "name": "Unstoppable",
      "description": "Won 5 games in a row.",
      "image": "uploads/unstoppable.png",
      "criteria": { 
         "type": "win_streak",
          "threshold": 5 
      }
    },
    {
      "_id": "cooperative_master",
      "name": "Cooperative Master",
      "description": "Won 10, 25, or 50 cooperative games.",
      "badges": {
        "bronze": "uploads/cooperative_master_bronze.png",
        "silver": "uploads/cooperative_master_silver.png",
        "gold": "uploads/cooperative_master_gold.png"
      },
      "criteria": { 
         "type": "cooperative_wins", 
         "levels": {
            "bronze": 10,
            "silver": 25,
            "gold": 50
         }
      }
    },
    {
      "_id": "collector",
      "name": "Collector",
      "description": "Ha giocato almeno 20 giochi diversi.",
      "image": "uploads/collector.png",
      "criteria": { 
         "type": "unique_games_played",
           "threshold": 20 
      }
    },
    #{
    #  "_id": "king_of_the_table",
    #  "name": "King of the Table",
    #  "description": "Player with the most wins in a year.",
    #  "image": "uploads/king_of_the_table.png",
    #  "criteria": { "type": "most_wins_in_year" }
    #},
    #{
    #  "_id": "last_place_champion",
    #  "name": "Last Place Champion",
    #  "description": "Player with the most losses in a year.",
    #  "image": "uploads/last_place_champion.png",
    #  "criteria": { "type": "most_losses_in_year" }
    #},
    {
      "_id": "lucky_number",
      "name": "Lucky Number",
      "description": "Scored exactly 100 points in a game.",
      "image": "uploads/lucky_number.png",
      "criteria": { 
         "type": "exact_score", 
         "threshold": 100 
         }
    },
    {
      "_id": "jack_of_all_trades",
      "name": "Jack of All Trades",
      "description": "Won 10 games in different games.",
      "image": "uploads/jack_of_all_trades.png",
      "criteria": { 
         "type": "wins_in_different_games", 
         "threshold": 10 
      }
    },
    {
      "_id": "one_point_win",
      "name": "One Point Win",
      "description": "Won a game with only 1 point difference from second place.",
      "image": "uploads/one_point_win.png",
      "criteria": { "type": "win_by_one_point" }
    },
    {
      "_id": "flawless_victory",
      "name": "Flawless Victory",
      "description": "Won all games in a night, given at least 5 games.",
      "image": "uploads/flawless_victory.png",
      "criteria": { 
          "type": "all_wins_in_night",
           "threshold": 5
      }
    }
  ]

  for achievement in achievements:
    # Process the "image" key if present (a single file)
    if 'image' in achievement:
        achievement['image'] = process_file(achievement['image'], STORAGE_TYPE)

    # Process the "badges" key if present (a dictionary of file paths)
    if 'badges' in achievement:
        processed_badges = {}
        for key, file_path in achievement['badges'].items():
            processed_badges[key] = process_file(file_path, STORAGE_TYPE)
        achievement['badges'] = processed_badges
    
    achievements_collection.insert_one(achievement)

def process_file(file_path, storage_type):
  filename = os.path.basename(file_path)
  unique_filename = f"{uuid.uuid4()}_{filename}"
  
  # Build an absolute path from the project root.
  abs_path = os.path.join(current_app.root_path, file_path)
  
  # Create a FileStorage instance from the file
  fs = FileStorage(stream=open(abs_path, 'rb'),
                    filename=filename,
                    content_type='image/png')
  
  if storage_type == 'local':
      final_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
      with open(final_path, 'wb') as out_file:
          # Write the file data from the FileStorage stream
          out_file.write(fs.stream.read())
      # Reset pointer if needed later
      fs.stream.seek(0)
  elif storage_type == 's3':
      final_path = S3Client.put(
          fs,
          unique_filename,
          content_type=fs.content_type
      )
  return {
      'type': storage_type,
      'filename': final_path
  }