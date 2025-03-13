from datetime import datetime

from bson import ObjectId
from .db import achievements_collection, players_collection

def check_update_achievements(player_ids, match_doc):
  # Get all the player in the match

  player_ids = [ObjectId(player_id) for player_id in player_ids]

  players = list(players_collection.find({"_id": {"$in": player_ids}}))

  #print(player_ids)
  #print(players)

  achievements = list(achievements_collection.find())


  # For each player in the match check if they have achieved any achievements
  for player in players:
    for achievement in achievements:
      if "levels" in achievement["criteria"]:
        # The achievement has levels, check the unlocked level
        player_achievements = player.get("achievements", [])
        unlocked_level = None
        for p_achievement in player_achievements:
          if achievement["_id"] == p_achievement.get("achievement_id"):
            if p_achievement.get("level") == "gold":
              unlocked_level = p_achievement.get("level")
              break
        
        # If the player has already achieved the highest level, skip the achievement
        if unlocked_level == "gold":
          continue
      else: 
        # Check if the player has already achieved the achievement
        if any(p_ach.get("achievement_id") == achievement["_id"] for p_ach in player.get("achievements", [])):
          continue

      # Check the criteria for the achievement is met
      add_achievement, achievement_met = check_achievement(player, match_doc, achievement)
      if add_achievement:
        # Find the achievement in the player's achievements to update it
        found = False
        for idx, p_achievement in enumerate(player.get("achievements", [])):
          if p_achievement.get("achievement_id") == achievement["_id"]:
            player["achievements"][idx] = achievement_met
            found = True
            break
        if not found:
          # The player has not achieved the achievement before
          player["achievements"].append(achievement_met)
      players_collection.update_one({'_id': player['_id']}, {'$set': player})


def is_level_upgrade(current_level, new_level):
  levels = ["bronze", "silver", "gold"]
  if current_level is None:
    return True
  else:
    return levels.index(new_level) > levels.index(current_level)

def check_achievement(player, match, achievement):
  # Check the criteria for the achievement
  if achievement["criteria"]["type"] == "total_matches":
    # Check for the tier of the achievement
    unlocked_level = None
    player_achievements = player.get("achievements", {})
    for p_achievement in player_achievements:
      if achievement["_id"] == p_achievement.get("achievement_id"):
        unlocked_level = p_achievement.get("level")
        break
    
    # Check the possible new level of the achievement
    new_level = None
    # Get all the trasholds
    thresholds = achievement["criteria"]["levels"]
    for level, threshold in thresholds.items():
      if player.get("total_matches") >= threshold:
        new_level = level
      else:
        break
    
    ach_to_append = {
      "achievement_id": achievement["_id"],
      "level": new_level,
      "unlocked_at": datetime.now(),
      "image": achievement["badges"].get(new_level),
      "description": achievement["description"]
    }

    if new_level is None:
      return False, None
    else:
      return is_level_upgrade(unlocked_level, new_level), ach_to_append

  elif achievement["criteria"]["type"] == "win_streak":
    if player.get("winstreak") >= achievement["criteria"]["threshold"]:
      ach_to_append = {
        "achievement_id": achievement["_id"],
        "unlocked_at": datetime.now(),
        "image": achievement["image"],
        "description": achievement["description"]
      }
      return True, ach_to_append  
    else :
      return False, None
  
  elif achievement["criteria"]["type"] == "cooperative_wins":
    # Check for the tier of the achievement
    player_achievements = player.get("achievements", {})
    unlocked_level = None
    for p_achievement in player_achievements:
      if achievement["_id"] == p_achievement.get("achievement_id"):
        unlocked_level = p_achievement.get("level")
        break
    
    # Check the possible new level of the achievement
    new_level = None
    # Get all the trasholds
    thresholds = achievement["criteria"]["levels"]
    for level, threshold in thresholds.items():
      if player.get("wins") - player.get("num_competitive_win", 0) >= threshold:
        new_level = level
      else:
        break
    
    ach_to_append = {
      "achievement_id": achievement["_id"],
      "level": new_level,
      "unlocked_at": datetime.now(),
      "image": achievement["badges"].get(new_level),
      "description": achievement["description"]
    }

    if new_level is None:
      return False, None
    else:
      return is_level_upgrade(unlocked_level, new_level), ach_to_append

  elif achievement["criteria"]["type"] == "unique_games_played":
    # Get the number of matches and count the unique game ids
    matches = list(player.get("matches", []))
    unique_games = len(set([match["game_id"] for match in matches]))
    if unique_games >= achievement["criteria"]["threshold"]:
      ach_to_append = {
        "achievement_id": achievement["_id"],
        "unlocked_at": datetime.now(),
        "image": achievement["image"],
        "description": achievement["description"]
      }
      return True, ach_to_append
    else:
      return False, None
    
  elif achievement["criteria"]["type"] == "exact_score":
    # Get the last match of the player and check if the score is 100
    last_match = player.get("matches", [])[-1]
    if last_match["score"] == achievement["criteria"]["threshold"]:
      ach_to_append = {
        "achievement_id": achievement["_id"],
        "unlocked_at": datetime.now(),
        "image": achievement["image"],
        "description": achievement["description"]
      }
      return True, ach_to_append
    else:
      return False, None
  
  elif achievement["criteria"]["type"] == "jack_of_all_trades":
    # Get the matches of the player 
    matches = player.get("matches", [])

    # Count the number of unique games the player has won
    unique_games = len(set(match["game_id"] for match in matches if match["is_winner"]))
    if unique_games >= achievement["criteria"]["threshold"]:
      ach_to_append = {
        "achievement_id": achievement["_id"],
        "unlocked_at": datetime.now(),
        "image": achievement["image"],
        "description": achievement["description"]
      }
      return True, ach_to_append
    else:
      return False, None
    
  elif achievement["criteria"]["type"] == "win_by_one_point":
    # Get the players from the match
    players = match.get("players", [])

    # Get the top 2 scores and check if the difference is 1
    top_scores = sorted(((player["score"], player["id"]) for player in players), reverse=True)[:2]
    # Only assign the achievement to the player with the highest score
    if (top_scores[0][0] - top_scores[1][0] == 1) and (top_scores[0][1] == str(player["_id"])):
      ach_to_append = {
        "achievement_id": achievement["_id"],
        "unlocked_at": datetime.now(),
        "image": achievement["image"],
        "description": achievement["description"]
      }
      return True, ach_to_append
    else:
      return False, None
  
  elif achievement["criteria"]["type"] == "all_wins_in_night":
    # Get all the matches of the playes from the same night as today where the player is the winner
    matches = list(player.get("matches", []))
    today = datetime.now().date()
    same_night_matches = [match for match in matches if datetime.strptime(match["date"], "%Y-%m-%d").date() == today and match["is_winner"]]
    if len(same_night_matches) >= achievement["criteria"]["threshold"]:
      ach_to_append = {
        "achievement_id": achievement["_id"],
        "unlocked_at": datetime.now(),
        "image": achievement["image"],
        "description": achievement["description"]
      }
      return True, ach_to_append
    else:
      return False, None
  else:
    return False, None