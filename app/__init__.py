# app/__init__.py
from flask import Flask
from .services import bgg_import

def create_app():
    app = Flask(__name__)
    
    # Importa le route
    #with app.app_context():
    #    from .routes import bp as main_blueprint
    #    app.register_blueprint(main_blueprint)

    bgg_import.import_games_from_bgg('ArcherMaster')

    #return app