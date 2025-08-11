import { useEffect, useState } from "react";
import { Game } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { Button, Container, Grid, Modal, Paper, useMantineColorScheme, Text, Title, Image, Autocomplete, Group, Divider, ActionIcon } from "@mantine/core";
import GameCard from "../components/GameCard";
import { IconPlus } from "@tabler/icons-react";

interface ApiResponseItem {
  bgg_id: string;
  name: string;
  min_players: string;
  max_players: string;
  average_duration: string;
  image: {
    url: string;
  };
  is_cooperative: boolean;
  notes: string;
  price: string;
  isGifted: boolean;
  username: string;
}

const GamesPage = () => {

  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [games, setGames] = useState<Game[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  //const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  useEffect(() => {
    if (query.length >= 3) {
      setSuggestions([]); // Clear suggestions
      searchGames(query); // Search for games
    } else {
      setSuggestions([]); // Clear suggestions
      setSelectedGame(null); // Clear selected game
    }
  }, [query]);

  const fetchGames = async () => {
    const requestOptions: RequestInit = {
      method: "GET",
    };
    // Check the JWT_STORAGE value and set credentials or headers accordingly
    if (JWT_STORAGE === "cookie") {
      requestOptions.credentials = "include";
    } else if (JWT_STORAGE === "localstorage") {
      requestOptions.headers = {
        Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
      };
    }


    const [gamesResponse, rulesResponse] = await Promise.all([
      fetch(`${API_URL}/games`, requestOptions),
      fetch(`${API_URL}/getGamesWithRules`, requestOptions),
    ]);
    const data: ApiResponseItem[] = await gamesResponse.json();
    const bgg_ids = await rulesResponse.json();

    const mappedGames = data.map((game) => ({
      bgg_id: game.bgg_id,
      name: game.name,
      minPlayers: game.min_players,
      maxPlayers: game.max_players,
      playingTime: game.average_duration,
      thumbnail: game.image.url,
      yearPublished: "Unknown",
      is_cooperative: game.is_cooperative,
      notes: game.notes,
      price: game.price || "", // Ensure price field is included
      isGifted: game.isGifted || false, // Ensure isGift field is included
      username: game.username || "", // Get username from local storage
      hasRules: bgg_ids.includes(game.bgg_id), // Add hasRules flag based on bgg_ids
    }));

    // Sort games by name
    mappedGames.sort((a, b) => a.name.localeCompare(b.name));

    setGames(mappedGames);
  };

  useEffect(() => {
    fetchGames();
  }, []);

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

    // Remove duplicates
    const uniqueItems = items.filter((item, index, self) =>
      index === self.findIndex((t) => t.bgg_id === item.bgg_id)
    );
    setSuggestions(uniqueItems);
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

  const addGame = async () => {
    if (!selectedGame) return;
    //setLoading(true);

    const requestOptions: RequestInit = {
      method: "POST",
    };

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
    });

    const response = await fetch(`${API_URL}/addGame`, requestOptions);
    if (response.ok) {
      fetchGames();
    }

    //setLoading(false);
  };

  const handleCloseModal = () => {
    setSelectedGame(null);
    setSuggestions([]);
    setQuery("");
    setModalOpened(false);
  };

  return (
    <Container size="xl" className="!px-4 md:!px-6">
      <Group justify="flex-end" mb="md">
        <ActionIcon
          variant={isDarkMode ? "filled" : "light"}
          color="blue"
          size={48}
          radius="xl"
          onClick={() => setModalOpened(true)}
          aria-label="Aggiungi un gioco"
          style={{
            boxShadow: isDarkMode
              ? "0 2px 12px 0 rgba(30,64,175,0.10)"
              : "0 2px 12px 0 rgba(59,130,246,0.08)",
            transition: "box-shadow 0.2s",
          }}
        >
          <IconPlus size={28} />
        </ActionIcon>
      </Group>
      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={
          <Group gap="xs">
            <IconPlus size={22} />
            <Text fw={600} size="lg">
              Add Game
            </Text>
          </Group>
        }
        centered
        size="lg"
        overlayProps={{
          blur: 2,
          opacity: 0.15,
        }}
        radius="lg"
        padding="lg"
        styles={{
          header: {
            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
            marginBottom: 8,
            paddingBottom: 8,
          },
        }}
      >
        <Autocomplete
          clearable
          label="Search"
          placeholder="Type at least 3 characters"
          value={query}
          onChange={(value) => {
            setQuery(value);
            searchGames(value);
          }}
          onOptionSubmit={(item) => {
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
            input: {
              borderRadius: '0.5rem',
              height: '2.5rem',
              backgroundColor: isDarkMode ? "#374151" : "white",
              borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
              color: isDarkMode ? "#f3f4f6" : "#1f2937",
              "&:focus": {
                borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
              },
            },
            label: {
              fontSize: '0.95rem',
              fontWeight: 600,
              marginBottom: '4px',
              color: isDarkMode ? "#d1d5db" : "#4b5563",
            },
            dropdown: {
              backgroundColor: isDarkMode ? "#374151" : "white",
              borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
            },
            option: {
              backgroundColor: isDarkMode ? "#374151" : "white",
              color: isDarkMode ? "#f3f4f6" : "#1f2937",
              "&:hover": {
                backgroundColor: isDarkMode ? "#4b5563" : "#f9fafb",
              },
            },
          }}
        />

        {selectedGame && (
          <>
            <Divider my="md" />
            <Paper
              p="md"
              withBorder
              radius="md"
              className="!mt-4"
              style={{
                background: isDarkMode
                  ? "#1e293b"
                  : "#f1f5f9",
                borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                boxShadow: isDarkMode
                  ? "0 2px 12px 0 rgba(30,64,175,0.15)"
                  : "0 2px 12px 0 rgba(59,130,246,0.10)",
              }}
            >
              <Group align="flex-start" gap={"lg"} wrap="nowrap">
                <Image
                  src={selectedGame.thumbnail}
                  alt={selectedGame.name}
                  radius="md"
                  width={100}
                  height={100}
                  fit="cover"
                  className="!rounded-md !shadow-sm"
                  style={{
                    border: `2px solid ${isDarkMode ? "#60a5fa" : "#3b82f6"}`,
                  }}
                />
                <div>
                  <Title
                    order={3}
                    className="!mb-2 !text-lg !font-semibold"
                    c={isDarkMode ? "blue.2" : "blue.7"}
                  >
                    {selectedGame.name}
                  </Title>
                  <Text size="sm" c={isDarkMode ? "gray.3" : "gray.7"}>
                    Players: {selectedGame.minPlayers} - {selectedGame.maxPlayers}
                  </Text>
                  <Text size="sm" c={isDarkMode ? "gray.3" : "gray.7"}>
                    Duration: {selectedGame.playingTime} minutes
                  </Text>
                </div>
              </Group>
              <Button
                onClick={() => { addGame(); handleCloseModal(); }}
                fullWidth
                mt="md"
                size="md"
                leftSection={<IconPlus size={18} />}
                className={`!transition-colors !font-semibold ${isDarkMode
                  ? "!bg-blue-700 !text-blue-200 hover:!bg-blue-600"
                  : "!bg-blue-600 !text-white hover:!bg-blue-700"
                  }`}
                radius="md"
                style={{ marginTop: 24 }}
              >
                Add Game to Collection
              </Button>
            </Paper>
          </>
        )}
      </Modal>
      <Grid gutter="md">
        {games.map((game) => (
          <Grid.Col
            key={game.bgg_id}
            span={{ base: 12, xs: 6, sm: 4, md: 3, lg: 2.4 }}
          >
            <GameCard game={game} />
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
};

export default GamesPage;