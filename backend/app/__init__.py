# app/__init__.py
from flask import Flask
from .services import bgg_import
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from datetime import timedelta
import os

def create_app():
    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = 'super-secret'  #FIXME Change this!
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(weeks=4)
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']  # Indica che il JWT verrà letto dai cookie
    app.config['JWT_COOKIE_SECURE'] = True  # True in produzione (richiede HTTPS)
    app.config['JWT_ACCESS_COOKIE_NAME'] = 'jwt_token'  # Nome del cookie
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads')
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False
    
    jwt = JWTManager(app)

    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

    #@app.after_request
    #def add_cors_headers(response):
    #    """
    #    Aggiunge gli header necessari per supportare le richieste CORS e credenziali.
    #    """
    #    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'  # Frontend
    #    response.headers['Access-Control-Allow-Credentials'] = 'true'
    #    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    #    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    #    return response
    # Import games from BGG
    #bgg_import.import_games_from_bgg('ArcherMaster')

    # Importa le route
    with app.app_context():
        from .routes import auth_bp as auth_blueprint
        from .routes import data_bp as data_blueprint
        from .routes import statistic_bp as statistic_blueprint
        from .routes import utility_bp as utility_blueprint
        app.register_blueprint(auth_blueprint)
        app.register_blueprint(data_blueprint)
        app.register_blueprint(statistic_blueprint)
        app.register_blueprint(utility_blueprint)

    #bgg_import.import_games_from_bgg('ArcherMaster')

    return app