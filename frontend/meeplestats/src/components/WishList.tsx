import { useEffect, useState } from "react";
import { Box, Button, LoadingOverlay, Textarea, Autocomplete, Card, Image, Title, Text, Grid } from "@mantine/core";
//import { useForm } from "@mantine/form";
import { Game } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";


interface ApiResponseItem {
  game_id: string;
  game_name: string;
  min_players: string;
  max_players: string;
  average_duration: string;
  image: {
    url: string;
  };
  is_cooperative: boolean;
  notes: string;
}

const Wishlist = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [wishlist, setWishlist] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (query.length >= 3) {
      setSuggestions([]); // Clear suggestions
      searchGames(query); // Search for games
    } else {
      setSuggestions([]); // Clear suggestions
      setSelectedGame(null); // Clear selected game
    }
  }, [query]);

  const searchGames = async (query: string) => {
    if (query.length < 3) return; // Minimum 3 characters for search query
    const response = await fetch(`https://boardgamegeek.com/xmlapi2/search?query=${query}`);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const items = Array.from(xml.querySelectorAll("item")).map((item) => ({
      bgg_id: item.getAttribute("id") || "",
      name: item?.querySelector("name")?.getAttribute("value") || "",
      minPlayers: item?.querySelector("minplayers")?.getAttribute("value") || "",
      maxPlayers: item?.querySelector("maxplayers")?.getAttribute("value") || "",
      playingTime: item?.querySelector("playingtime")?.getAttribute("value") || "",
      thumbnail: item?.querySelector("image")?.textContent || "",
      yearPublished: item?.querySelector("yearpublished")?.getAttribute("value") ||
        "Unknown",
      is_cooperative: false,
      notes: "",
      price: "0",
      isGifted: false,
    }));

    // Rimuovi duplicati
    const uniqueItems = items.filter((item, index, self) =>
      index === self.findIndex((t) => t.name === item.name)
    );
    setSuggestions(uniqueItems);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSelectedGame((prev) => prev ? { ...prev, notes: e.target.value } : null);
  };

  const selectGame = async (id: string) => {
    const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${id}`);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const item = xml.querySelector("item");
    const details = {
      name: item?.querySelector("name")?.getAttribute("value") || "",
      minPlayers: item?.querySelector("minplayers")?.getAttribute("value") || "",
      maxPlayers: item?.querySelector("maxplayers")?.getAttribute("value") || "",
      playingTime: item?.querySelector("playingtime")?.getAttribute("value") || "",
      thumbnail: item?.querySelector("image")?.textContent || "",
      yearPublished: item?.querySelector("yearpublished")?.getAttribute("value") || "Unknown",
      is_cooperative: false,
      notes: "",
      price: "0",
      isGifted: false,
    };
    setSelectedGame({ bgg_id: id, ...details });
  };

  const addToWishlist = async () => {
    if (!selectedGame) return;
    setLoading(true);

    const requestOptions: RequestInit = {
      method: "POST",
    };

    // Check the JWT_STORAGE value and set credentials or headers accordingly
    if (JWT_STORAGE === "cookie") {
      requestOptions.credentials = "include";
      requestOptions.headers = {
        "Content-Type": "application/json",
      };
    } else if (JWT_STORAGE === "localstorage") {
      requestOptions.headers = {
        Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        "Content-Type": "application/json"
      };
    }

    requestOptions.body = JSON.stringify({
      game_id: selectedGame.bgg_id,
      notes: selectedGame.notes,
    });

    const response = await fetch(`${API_URL}/addwishlist`, requestOptions);
    if (response.ok) {
      fetchWishlist();
    }
    setLoading(false);
  };

  const fetchWishlist = async () => {

    const requestOptions: RequestInit = {
      method: "GET",
    };

    // Check the JWT_STORAGE value and set credentials or headers accordingly
    if (JWT_STORAGE === "cookie") {
      requestOptions.credentials = "include";
    } else if (JWT_STORAGE === "localstorage") {
      requestOptions.headers = {
        Authorization: `Bearer ${localStorage.getItem("jwt_token")}`
      };
    }

    const response = await fetch(`${API_URL}/wishlist`, requestOptions);
    const data: ApiResponseItem[] = await response.json();
    // map data into Game objects

    const mappedData = data.map((item) => ({
      bgg_id: item.game_id,
      name: item.game_name,
      minPlayers: item.min_players,
      maxPlayers: item.max_players,
      playingTime: item.average_duration,
      thumbnail: item.image.url,
      yearPublished: "Unknown",
      is_cooperative: item.is_cooperative,
      notes: item.notes,
      price: "0",
      isGifted: false,
    }));

    setWishlist(mappedData);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <Box>
      <Box pos="relative" w={320} mx="auto">
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <h1>Wishlist</h1>
        <Autocomplete
          clearable
          label="Search for games"
          placeholder="Search for games"
          value={query}
          onChange={(value) => {
            setQuery(value);
            searchGames(value);
          }}
          onOptionSubmit={(item) => {
            const selected = suggestions.find((game) => game.name.toLowerCase() === item.toLowerCase());
            if (selected) {
              selectGame(selected.bgg_id);
            } else {
              console.log("Game not found in suggestions");
            }
          }}
          data={suggestions.map((game: Game) => ({
            value: game.name,
            label: `${game.name} (${game.yearPublished})`,
            id: game.bgg_id,
          }))}
        />
        {selectedGame && (
          <Box>
            <Title order={2}>{selectedGame.name}</Title>
            <Image src={selectedGame.thumbnail} alt={selectedGame.name} />
            <Text>
              Players: {selectedGame.minPlayers} - {selectedGame.maxPlayers}
            </Text>
            <Text>Playing Time: {selectedGame.playingTime} minutes</Text>
            <Textarea
              label="Notes"
              placeholder="Notes"
              value={selectedGame.notes}
              onChange={handleNotesChange}
            />
            <Button onClick={addToWishlist} mt="md">Add to Wishlist</Button>
          </Box>
        )}

      </Box>
      <Box>
        <h2>Current Wishlist</h2>
        <Grid gutter="md">
          {wishlist.map((game) => (
            <Grid.Col span={4} key={game.bgg_id}>
              <Card shadow="sm" padding="lg">
                <Card.Section>
                  <Image src={game.thumbnail} alt={game.name} height={160} />
                </Card.Section>
                <Title order={4}>{game.name}</Title>
                <Text>Players: {game.minPlayers} - {game.maxPlayers}</Text>
                <Text>Playing Time: {game.playingTime} minutes</Text>
                <Text>{game.notes}</Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Wishlist;