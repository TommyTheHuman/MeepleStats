import { useEffect, useState } from "react";

function Wishlist() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [wishlist, setWishlist] = useState([]);

    // fetch games from BGG based on search query
    const searchGames = async () => {
        const response = await fetch(
            `https://boardgamegeek.com/xmlapi2/search?query=${query}`
        );
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const items = Array.from(xml.querySelectorAll("item")).map((item) => ({
            id: item?.getAttribute("id"),
            name: item?.querySelector("name")?.getAttribute("value"),
            yearPublished:
                item?.querySelector("yearpublished")?.getAttribute("value") ||
                "Unknown",
        }));
        setSuggestions(items);
    };

    // handle notes change
    const handleNotesChange = (e) => {
        setSelectedGame((prev) => ({ ...prev, notes: e.target.value }));
    };

    // fetch game details from BGG based on game id
    const selectGame = async (id) => {
        const response = await fetch(
            `https://boardgamegeek.com/xmlapi2/thing?id=${id}`
        );
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const item = xml.querySelector("item");
        const details = {
            name: item?.querySelector("name").getAttribute("value"),
            minPlayers: item?.querySelector("minplayers").getAttribute("value"),
            maxPlayers: item?.querySelector("maxplayers").getAttribute("value"),
            playingTime: item
                ?.querySelector("playingtime")
                .getAttribute("value"),
            thumbnail: item?.querySelector("thumbnail").textContent,
            yearPublished:
                item?.querySelector("yearpublished")?.getAttribute("value") ||
                "Unknown",
            notes: "",
        };
        setSelectedGame({ id, ...details });
    };

    // add selected game to wishlist
    const addToWishlist = () => {
        const response = fetch("http://127.0.0.1:5000/addwishlist", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                game_id: selectedGame.id,
                notes: selectedGame.notes,
            }),
        });
        response.then(() => fetchWishlist());
    };

    // fetch wishlist from the backend
    const fetchWishlist = async () => {
        await fetch("http://127.0.0.1:5000/wishlist")
            .then((response) => response.json())
            .then((data) => setWishlist(data))
            .catch((error) => console.error("Error fetching wishlist:", error));
    };

    // useEffect to fetch wishlist on page load
    useEffect(() => {
        fetchWishlist();
    }, []);

    return (
        <div>
            <h1>Wishlist</h1>
            {/* SearchBar for new games */}
            <input
                type="text"
                placeholder="Search for games"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchGames()}
            />

            <ul className="flex gap-4 flex-col grow items-center text-left container mx-auto ">
                {suggestions.map((game, i) => (
                    <li
                        className="flex w-1/2 items-start text-left border-black border-b-[1px]"
                        key={i}
                        onClick={() => selectGame(game.id)}
                    >
                        {game.name} {game.id} {game.yearPublished}
                    </li>
                ))}
            </ul>
            {/* Selected game detail */}
            {selectedGame && (
                <div>
                    <h2>{selectedGame.name}</h2>
                    <img src={selectedGame.thumbnail} alt={selectedGame.name} />
                    <p>
                        Players: {selectedGame.minPlayers} -{" "}
                        {selectedGame.maxPlayers}
                    </p>
                    <p>Playing Time: {selectedGame.playingTime} minutes</p>
                    <label htmlFor="notes">Notes:</label>
                    <input
                        type="text"
                        placeholder="Notes"
                        name="notes"
                        id="notes"
                        value={selectedGame.notes}
                        onChange={handleNotesChange}
                    />
                    <button onClick={addToWishlist}>Add to Wishlist</button>
                </div>
            )}

            {/* Actual wishlist */}
            <h2>Current Wishlist</h2>
            <ul>
                {wishlist.map((game) => (
                    <li key={game.game_id}>
                        <h3>{game.game_name}</h3>
                        <img
                            src={game.image.thumbnail}
                            alt={game.game_name}
                            style={{ width: "100px" }}
                        />
                        <p>
                            Players: {game.min_players || 0} -{" "}
                            {game.max_players || 0}
                        </p>
                        <p>
                            Playing Time: {game.average_duration || "unknown"}{" "}
                            minutes
                        </p>
                        <p>Added at: {game.added_at}</p>
                        <p>Added by: {game.username}</p>
                        <p>Notes: {game.notes}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Wishlist;
