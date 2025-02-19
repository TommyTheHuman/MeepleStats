import { Grid, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { MatchCardInterface } from '../model/Interfaces';
import MatchCard from '../components/MatchCards';
import { API_URL, JWT_STORAGE } from '../model/Constants';


const MatchHistoryPage = () => {

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchCardInterface[]>([]);

  useEffect(() => {
    const loadMatchHistory = async () => {
      setLoading(true);
      try {

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

        const response = await fetch(`${API_URL}/matchHistory`, requestOptions);
        const data: MatchCardInterface[] = await response.json();
        setMatches(data);
        setError(null);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(String(error));
        }
      } finally {
        setLoading(false);
      };
    }
    loadMatchHistory();
  }, []);

  return (
    <div>
      <Text size="xl" w={500} mb="md">Match History</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : error ? (
        <Text c="red">{error}</Text>
      ) : (
        <Grid>
          {matches.map((match, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <MatchCard
                game_name={match.game_name}
                date={match.date}
                game_duration={match.game_duration}
                winner={match.winner}
                game_image={match.game_image}
                players={match.players}
              />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </div>
  );
};

export default MatchHistoryPage;

