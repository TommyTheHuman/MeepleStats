import { useEffect, useState } from "react";
import Select from "react-select";
import axios from 'axios';

function LogGameForm() {

    const [games, setGames] = useState([]);
    const [players, setPlayers] = useState([]);
    // const [selectedGame, setSelectedGame] = useState("");
    // const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [formData, setFormData] = useState({
        game: "",
        game_id: "",
        note: "",
        date: new Date().toISOString().split('T')[0],
        image: null,
        players: [], // Contiene { id, score }
        duration: "",
        isCooperative: false,
      });

    useEffect(() => {
        // Fetch the games from the /games route
        fetch("http://127.0.0.1:5000/games", {
            method: "GET",
            credentials: "include", 
            headers: {
                'Content-Type': 'application/json'
              }
        } )
          .then((response) => response.json())
          .then((data) => {
            const sortedGames = data.sort((a, b) => a.name.localeCompare(b.name));
            setGames(sortedGames);
          })
          .catch((error) => console.error("Error fetching games:", error));
      }, []); // The empty array ensures this runs only once

    useEffect(() => {
        // Fetch the players from the /players route
        fetch("http://127.0.0.1:5000/players")
            .then((response) => response.json())
            .then((data) => {
                const sortedPlayers = data.sort((a, b) => a.username.localeCompare(b.username));
                setPlayers(sortedPlayers);
            })
            .catch((error) => console.error("Error fetching players:", error));
    }, []); // The empty array ensures this runs only once

    const handleChange = (field, value) => {
        const selectedGame = games.find(game => game.name === value);
        //console.log(selectedGame);
        setFormData((prevState) => ({
          ...prevState,
          [field]: value,
          game_id: field === "game" ? selectedGame.bgg_id : formData.game_id,
          isCooperative: field === "game" ? selectedGame.is_cooperative : formData.isCooperative,
        }));
    };

    const handlePlayerChange = (selectedOptions) => {
        const playersWithScores = selectedOptions.map((option) => ({
            id: option.value,
            name: option.label,
            score: formData.players.find((player) => player.id === option.value)?.score || 0,
        }));
        handleChange("players", playersWithScores);
    };

    const handleFileChange = (event) => {
        handleChange("image", event.target.files[0]);
    };

    const handleScoreChange = (index, newScore) => {
        const updatedPlayers = [...formData.players];
        updatedPlayers[index].score = parseInt(newScore, 10) || 0;
        handleChange("players", updatedPlayers);
    };

    const handleCheckboxChange = (e) => {
        setFormData({
          ...formData,
          isWin: e.target.checked,
        });
    };

    const handleSubmit = async (event) => {
    event.preventDefault();
    console.log(formData.image);
    
    console.log(formData);

    const data = new FormData();

    // Aggiungi i dati al FormData
    data.append("game", formData.game);
    data.append("game_id", formData.game_id);
    data.append("note", formData.note);
    data.append("date", formData.date);
    data.append("image", formData.image);
    data.append("duration", formData.duration);
    data.append("isWin", formData.isWin);

    formData.players.forEach((player, index) => {
      data.append(`players[${index}][id]`, player.id);
      data.append(`players[${index}][score]`, player.score);
      data.append(`players[${index}][name]`, player.name);
    });

    console.log(data);

    try {
        const response = await fetch('http://127.0.0.1:5000/logmatch', {
            credentials: "include",
            method: 'POST',
            body: data
        });
  
        if (response.ok) {
          const data = await response.json();
          console.log('Success:', data);
          // Azioni dopo il successo, es. reindirizzamento
        } else {
          console.error('Error:', response.statusText);
        }
      } catch (error) {
        console.error('Fetch Error:', error);
      }
    };

    return ( 
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="username">Username:</label>
                <select
                    id="game-select"
                    value={formData.game} // Associa lo stato alla combobox
                    onChange={(e) => handleChange("game", e.target.value)} // Aggiorna lo stato
                    required
                >
                    <option value="" disabled>-- Scegli un gioco --</option> {/* Placeholder */}
                    {games.map((game) => (
                    <option key={game.bgg_id} value={game.name}>
                        {game.name}
                    </option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="players-select">Players:</label>
                <Select
                    id="players-select"
                    options={players.map((player) => ({ value: player._id, label: player.username }))}
                    isMulti
                    onChange={handlePlayerChange}
                    value={formData.players.map((player) => ({
                        value: player.id,
                        label: player.name,
                      }))}
                    closeMenuOnSelect={false} // Non chiude il menu dopo la selezione
                />
            </div>
            {!formData.isCooperative && (<div>
                {formData.players.map((player, index) => (
                    <div>
                    <label>
                        {player.name}:
                        <input
                        type="number"
                        value={player.score}
                        onChange={(e) => handleScoreChange(index, e.target.value)}
                        min="0"
                        required
                        />
                    </label>
                    </div>
                ))}
            </div>
            )}
            {formData.isCooperative && (
            <div>
                <label>
                <input
                    type="checkbox"
                    checked={formData.isWin}
                    onChange={handleCheckboxChange}
                />
                Partita vinta
                </label>
            </div>
            )}
            <div>
                <label htmlFor="duration">Duration:</label>
                <input
                type="number"
                id="duration"
                value={formData.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                placeholder="Inserisci la durata in minuti"
                required
                min="0"
                />
            </div>
            <div>
                <label htmlFor="note">Note:</label>
                <textarea
                id="note"
                value={formData.note}
                onChange={(e) => handleChange("note", e.target.value)}
                placeholder="Inserisci note"
                ></textarea>
            </div>
            <div>
                <label htmlFor="date">Date:</label>
                <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
                
                />
            </div>
            <div>
                <label htmlFor="image-upload">Upload Image:</label>
                <input
                type="file"
                id="image-upload"
                onChange={handleFileChange}
                accept="image/*"
                />
            </div>
            <button type="submit">Log Game</button>
        </form>
     );
}

export default LogGameForm;