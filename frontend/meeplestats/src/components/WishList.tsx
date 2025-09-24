import { useEffect, useState } from "react";
import { Box, Button, LoadingOverlay, Textarea, Autocomplete, Image, Title, Text, Grid, Container, Paper, useMantineColorScheme } from "@mantine/core";
//import { useForm } from "@mantine/form";
import { Game } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import WishListCard from "./WishListCard";
import { useTranslation } from "react-i18next";

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
  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [wishlist, setWishlist] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();


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
          <Paper
            shadow="xs"
            p="md"
            radius="md"
            className="!mb-6 !sticky !top-4"
            style={{
              backgroundColor: isDarkMode ? "#1f2937" : "white",
              borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
            }}
            withBorder
          >
            <Title
              order={2}
              className="!mb-4 !text-xl !font-semibold"
              c={isDarkMode ? "gray.1" : "gray.8"}
            >
              {t("WishListAddToWishlist", { defaultValue: "Add to Wishlist" })}
            </Title>

            <Box pos="relative">
              <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "md", blur: 2 }} />

              <Autocomplete
                clearable
                label={t("WishListSearchForGames", { defaultValue: "Search for games" })}
                placeholder={t("WishListSearchPlaceholder", { defaultValue: "Type at least 3 characters" })}
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
                    fontSize: '0.875rem',
                    fontWeight: 500,
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
                <Paper
                  p="md"
                  withBorder
                  radius="md"
                  className="!mt-4"
                  style={{
                    backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                    borderColor: isDarkMode ? "#9ca3af" : "#e5e7eb",
                  }}
                >
                  <Title
                    order={3}
                    className="!mb-3 !text-lg !font-medium"
                    c={isDarkMode ? "gray.1" : "gray.9"}
                  >
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
                      <Text
                        size="sm"
                        className="!mb-1"
                        c={isDarkMode ? "gray.3" : "gray.7"}
                      >
                        {t("WishListPlayerCount", { defaultValue: "Players" })}: {selectedGame.minPlayers} - {selectedGame.maxPlayers}
                      </Text>
                      <Text
                        size="sm"
                        c={isDarkMode ? "gray.3" : "gray.7"}
                      >
                        {t("WishListPlayingTime", { defaultValue: "Playing Time" })}: {selectedGame.playingTime} {t("WishListMinutes", { defaultValue: "minutes" })}
                      </Text>
                    </div>
                  </div>

                  <Textarea
                    label={t("WishListNotes", { defaultValue: "Notes" })}
                    placeholder={t("WishListNotesPlaceholder", { defaultValue: "Add notes about this game" })}
                    value={selectedGame.notes}
                    onChange={handleNotesChange}
                    minRows={3}
                    styles={{
                      input: {
                        borderRadius: '0.5rem',
                        backgroundColor: isDarkMode ? "#4b5563" : "white",
                        borderColor: isDarkMode ? "#9ca3af" : "#d1d5db",
                        color: isDarkMode ? "#f3f4f6" : "#1f2937",
                        "&:focus": {
                          borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                        },
                      },
                      label: {
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        marginBottom: '4px',
                        color: isDarkMode ? "#d1d5db" : "#4b5563",
                      }
                    }}
                  />

                  <Button
                    onClick={addToWishlist}
                    fullWidth
                    mt="md"
                    className={`!transition-colors !font-medium ${isDarkMode
                      ? "!bg-blue-700 !text-blue-200 hover:!bg-blue-600"
                      : "!bg-blue-600 !text-white hover:!bg-blue-700"
                      }`}
                    radius="md"
                  >
                    {t("WishListAddToWishlistButton", { defaultValue: "Add to Wishlist" })}
                  </Button>
                </Paper>
              )}
            </Box>
          </Paper>
        </Grid.Col>

        {/* Wishlist Column - Full width on mobile, 2/3 on desktop */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Title
            order={2}
            className="!mb-4 !text-xl !font-semibold"
            c={isDarkMode ? "gray.1" : "gray.8"}
          >
            {t("WishListMyWishlist", { defaultValue: "My Wishlist" })}
          </Title>

          {wishlist.length === 0 ? (
            <Paper
              p="xl"
              radius="md"
              className="!border !text-center"
              style={{
                backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                borderColor: isDarkMode ? "#9ca3af" : "#e5e7eb",
              }}
            >
              <Text c={isDarkMode ? "gray.3" : "gray.6"}>{t("WishListEmpty", { defaultValue: "Your wishlist is empty. Search for games to add them." })}</Text>
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