# app/__init__.py
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from datetime import timedelta
from dotenv import load_dotenv
import os
from dotenv import find_dotenv

def create_app():
    app = Flask(__name__)

    dotenv_path = find_dotenv()
    if dotenv_path:
        load_dotenv(dotenv_path, override=True)
    else:
        print("File .env non trovato")

    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 28)))
    app.config['JWT_TOKEN_LOCATION'] = os.getenv('JWT_TOKEN_LOCATION')  # Indica che il JWT verrà letto dai cookie
    app.config['JWT_COOKIE_SECURE'] = os.getenv('JWT_COOKIE_SECURE', 'True').lower() in ['true', '1', 't']
    app.config['JWT_ACCESS_COOKIE_NAME'] = os.getenv('JWT_ACCESS_COOKIE_NAME', 'jwt_token')
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, os.getenv('UPLOAD_FOLDER', 'uploads'))
    app.config['JWT_COOKIE_CSRF_PROTECT'] = os.getenv('JWT_COOKIE_CSRF_PROTECT', 'False').lower() in ['true', '1', 't']
    
    jwt = JWTManager(app)

    cors_origin = os.getenv('CORS_ORIGIN')
    print(cors_origin)
    CORS(app, resources={r"/*": {"origins": cors_origin}}, supports_credentials=True)

    # route imports
    with app.app_context():
        from .routes import auth_bp as auth_blueprint
        from .routes import data_bp as data_blueprint
        from .routes import statistic_bp as statistic_blueprint
        from .routes import utility_bp as utility_blueprint
        from .routes import rulebooks_bp as rulebooks_blueprint
        app.register_blueprint(auth_blueprint)
        app.register_blueprint(data_blueprint)
        app.register_blueprint(statistic_blueprint)
        app.register_blueprint(utility_blueprint)
        app.register_blueprint(rulebooks_blueprint)

    return app