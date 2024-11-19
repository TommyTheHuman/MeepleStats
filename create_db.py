from app import create_app, db
from app.models import Game, Match, Player, Score

# Importa i modelli per registrarli con SQLAlchemy

# Crea l'applicazione
app = create_app()

with app.app_context():
    try:
        # Verifica la connessione al database
        print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print(f"Connessione al database: {db.engine}")

        # Creazione delle tabelle
        db.create_all()
        db.session.commit()  # Forza il commit delle transazioni
        print("Tabelle create con successo!")

        # Controlla se le tabelle esistono
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        if tables:
            print(f"Tabelle trovate nel database: {tables}")
        else:
            print("Nessuna tabella trovata nel database.")
    except Exception as e:
        print(f"Errore durante la creazione delle tabelle: {e}")

# Debug: verifica se i modelli sono stati importati correttamente
print("Modelli importati:")
print(Player)
print(Game)
print(Match)
print(Score)