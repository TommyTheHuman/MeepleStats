# app/__init__.py
from flask import Flask
from .services import bgg_import
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from datetime import timedelta

def create_app():
    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = 'super-secret'  #FIXME Change this!
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

    jwt = JWTManager(app)

    CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

    # Importa le route
    with app.app_context():
        #from .routes import bp as main_blueprint
        from .routes import auth_bp as auth_blueprint
        #app.register_blueprint(main_blueprint)
        app.register_blueprint(auth_blueprint)

    #bgg_import.import_games_from_bgg('ArcherMaster')

    return app