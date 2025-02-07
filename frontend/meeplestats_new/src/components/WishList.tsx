import { useEffect, useState } from "react";
import { Box, Button, LoadingOverlay, Textarea, Autocomplete, Card, Image, Title, Text, Grid } from "@mantine/core";
//import { useForm } from "@mantine/form";
import { Game } from "../model/Interfaces";


interface ApiResponseItem {
  game_id: string;
  game_name: string;
  min_players: string;
  max_players: string;
  average_duration: string;
  image: {
    thumbnail: string;
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

  // const form = useForm({
  //   initialValues: {
  //     notes: "",
  //   },
  // });

  useEffect(() => {
    if (query.length >= 3) {
      setSuggestions([]); // Pulisci i suggerimenti
      searchGames(query); // Avvia una nuova richiesta
    } else {
      setSuggestions([]); // Pulisci i suggerimenti
      setSelectedGame(null); // Pulisci il gioco selezionato
    }
  }, [query]);

  const searchGames = async (query: string) => {
    if (query.length < 3) return; // Invia la richiesta solo se la query ha almeno 3 caratteri
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
    };
    setSelectedGame({ bgg_id: id, ...details });
  };

  const addToWishlist = async () => {
    if (!selectedGame) return;
    setLoading(true);
    const response = await fetch('/api/addwishlist', {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        game_id: selectedGame.bgg_id,
        notes: selectedGame.notes,
      }),
    });
    if (response.ok) {
      fetchWishlist();
    }
    setLoading(false);
  };

  const fetchWishlist = async () => {
    const response = await fetch('/api/wishlist', { credentials: "include" });
    const data: ApiResponseItem[] = await response.json();
    // map data into Game objects

    const mappedData = data.map((item) => ({
      bgg_id: item.game_id,
      name: item.game_name,
      minPlayers: item.min_players,
      maxPlayers: item.max_players,
      playingTime: item.average_duration,
      thumbnail: item.image.thumbnail,
      yearPublished: "Unknown", // Se non è presente nella risposta dell'API
      is_cooperative: item.is_cooperative,
      notes: item.notes,
    }));

    setWishlist(mappedData);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
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
      <h2>Current Wishlist</h2>
      <Grid>
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
  );
};

export default Wishlist;