import { useEffect, useState } from "react";
import { Game } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { Container, Grid } from "@mantine/core";
import GameCard from "../components/GameCard";

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
  const [games, setGames] = useState<Game[]>([]);
  //const [loading, setLoading] = useState(true);

  useEffect(() => {
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

      const response = await fetch(`${API_URL}/games`, requestOptions)
      const data: ApiResponseItem[] = await response.json();
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
      }));

      setGames(mappedGames);
    };
    fetchGames();
  }, []);

  return (
    <Container size="xl" className="!px-4 md:!px-6">
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