from app import create_app, db
import app.models

# Importa i modelli per registrarli con SQLAlchemy

# Crea l'applicazione
app = create_app()

with app.app_context():
    try:
        # Creazione delle tabelle
        db.create_all()
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
