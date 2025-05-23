import { useEffect, useState } from "react";
import { Box, Button, LoadingOverlay, Textarea, Autocomplete, Image, Title, Text, Grid, Container, Paper } from "@mantine/core";
//import { useForm } from "@mantine/form";
import { Game } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import WishListCard from "./WishListCard";


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
  username: string;
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
      username: "",
    }));

    console.log(items); // Log the items to see the structure

    // Rimuovi duplicati
    const uniqueItems = items.filter((item, index, self) =>
      index === self.findIndex((t) => t.bgg_id === item.bgg_id)
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
      username: "",
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
      username: item.username,
    }));

    setWishlist(mappedData);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <Container size="xl" className="!px-4 md:!px-6">
      <Grid gutter="md">
        {/* Search Column - Full width on mobile, 1/3 on desktop */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="xs" p="md" radius="md" className="!bg-white !mb-6 !sticky !top-4">
            <Title order={2} className="!mb-4 !text-gray-800 !text-xl !font-semibold">
              Add to Wishlist
            </Title>

            <Box pos="relative">
              <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "md", blur: 2 }} />

              <Autocomplete
                clearable
                label="Search for games"
                placeholder="Type at least 3 characters"
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  searchGames(value);
                }}
                onOptionSubmit={(item) => {
                  console.log(item);
                  const itemName = item.split("_")[0];
                  const itemId = item.split("_")[1];
                  const selected = suggestions.find((game) => game.name.toLowerCase() === itemName.toLowerCase() && game.bgg_id === itemId);
                  if (selected) {
                    selectGame(selected.bgg_id);
                  }
                }}
                data={suggestions.map((game: Game) => ({
                  value: `${game.name}_${game.bgg_id}`,
                  label: `${game.name} (${game.yearPublished})`,
                  id: game.bgg_id,
                }))}
                className="!mb-4"
                styles={{
                  input: { borderRadius: '0.5rem', height: '2.5rem' },
                  label: { fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }
                }}
              />

              {selectedGame && (
                <Paper p="md" withBorder radius="md" className="!mt-4 !bg-gray-50">
                  <Title order={3} className="!mb-3 !text-lg !font-medium">
                    {selectedGame.name}
                  </Title>

                  <div className="!flex !items-center !gap-4 !mb-4">
                    <Image
                      src={selectedGame.thumbnail}
                      alt={selectedGame.name}
                      radius="md"
                      width={100}
                      height={100}
                      fit="cover"
                      className="!rounded-md !shadow-sm"
                    />

                    <div>
                      <Text size="sm" className="!text-gray-700 !mb-1">
                        Players: {selectedGame.minPlayers} - {selectedGame.maxPlayers}
                      </Text>
                      <Text size="sm" className="!text-gray-700">
                        Playing Time: {selectedGame.playingTime} minutes
                      </Text>
                    </div>
                  </div>

                  <Textarea
                    label="Notes"
                    placeholder="Add notes about this game"
                    value={selectedGame.notes}
                    onChange={handleNotesChange}
                    minRows={3}
                    styles={{
                      input: { borderRadius: '0.5rem' },
                      label: { fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }
                    }}
                  />

                  <Button
                    onClick={addToWishlist}
                    fullWidth
                    mt="md"
                    className="!bg-blue-600 hover:!bg-blue-700 !transition-colors"
                    radius="md"
                  >
                    Add to Wishlist
                  </Button>
                </Paper>
              )}
            </Box>
          </Paper>
        </Grid.Col>

        {/* Wishlist Column - Full width on mobile, 2/3 on desktop */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Title order={2} className="!mb-4 !text-gray-800 !text-xl !font-semibold">
            My Wishlist
          </Title>

          {wishlist.length === 0 ? (
            <Paper p="xl" radius="md" className="!bg-gray-50 !border !border-gray-200 !text-center">
              <Text className="!text-gray-600">Your wishlist is empty. Search for games to add them.</Text>
            </Paper>
          ) : (
            <Grid gutter="md">
              {wishlist.map((game) => (
                <Grid.Col span={{ base: 12, xs: 6, sm: 6, lg: 4 }} key={game.bgg_id}>
                  <WishListCard
                    name={game.name}
                    thumbnail={game.thumbnail}
                    minPlayers={game.minPlayers}
                    maxPlayers={game.maxPlayers}
                    playingTime={game.playingTime}
                    notes={game.notes}
                    username={game.username}
                    gameId={game.bgg_id}
                    onDelete={fetchWishlist}
                  />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default Wishlist;