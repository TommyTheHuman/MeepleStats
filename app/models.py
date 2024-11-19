from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from app import db
from werkzeug.security import generate_password_hash, check_password_hash

class Player(db.Model):
    __tablename__ = 'players'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, nullable=False)
    mail = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now())
    password_hash = db.Column(db.String, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Game(db.Model):
    __tablename__ = 'games'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    min_players = db.Column(db.Integer, nullable=False)
    max_players = db.Column(db.Integer, nullable=False)
    average_duration = db.Column(db.Integer, nullable=True)  # In minutes
    is_cooperative = db.Column(db.Boolean, nullable=False, default=False)

class Match(db.Model):
    __tablename__ = 'matches'

    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    date = db.Column(db.DateTime, nullable=False, server_default=db.func.now())
    is_cooperative = db.Column(db.Boolean, nullable=False, default=False)
    cooperative_result = db.Column(db.String, nullable=True)  # 'win', 'lose', or None

    game = db.relationship('Game', backref='matches')

class Score(db.Model):
    __tablename__ = 'scores'

    match_id = db.Column(db.Integer, db.ForeignKey('matches.id'), primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'), primary_key=True)
    score = db.Column(db.Integer, nullable=True)
    is_winner = db.Column(db.Boolean, nullable=True)  # Null for cooperative matches

    match = db.relationship('Match', backref='scores')
    player = db.relationship('Player', backref='scores')
