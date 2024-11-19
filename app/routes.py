from flask import Blueprint, render_template

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/games')
def games():
    # Dati fittizi per testare
    games = [
        {'name': 'Catan', 'category': 'Strategia', 'players': '3-4', 'average_time': 60},
        {'name': 'Pandemic', 'category': 'Cooperativo', 'players': '2-4', 'average_time': 45},
    ]
    return render_template('games.html', games=games)
