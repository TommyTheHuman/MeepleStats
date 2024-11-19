import requests

def import_games_from_bgg(username):
    url = f'https://boardgamegeek.com/xmlapi2/collection?username={username}&own=1'
    response = requests.get(url)
    if response.status_code == 200:
        # Parsing del risultato XML
        print("Importazione completata.")
    else:
        print("Errore nell'importazione.")
