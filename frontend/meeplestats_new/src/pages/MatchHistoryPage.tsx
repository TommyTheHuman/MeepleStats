import { Grid, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { MatchCardInterface } from '../model/Interfaces';
import MatchCard from '../components/MatchCards';

const MatchHistoryPage = () => {

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchCardInterface[]>([]);

  useEffect(() => {
    const loadMatchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://127.0.0.1:5000/matchHistory", {
          method: "GET",
          credentials: "include",
        });
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

