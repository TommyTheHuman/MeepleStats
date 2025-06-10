import { Container, Grid, Title, Text, Button, Group, Select } from "@mantine/core";
import StatisticCard from "../components/StatisticCard"; // Adjust the path as necessary
import { API_URL, FilterTypes, JWT_STORAGE } from "../model/Constants";
import PlayerAchievementCard from "../components/PlayerAchievementCard";
import { IconUser } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { Player } from "../model/Interfaces";

const filterTypeOptions = {
  startDate: { label: "Start Date", value: "start_date", type: FilterTypes.date },
  endDate: { label: "End Date", value: "end_date", type: FilterTypes.date },
  player: { label: "Player", value: "username", type: FilterTypes.string },
  month: { label: "Month", value: "month", type: FilterTypes.month },
  year: { label: "Year", value: "year", type: FilterTypes.year },
  game: { label: "Game", value: "game_name", type: FilterTypes.string },
}

export default function IndexPage() {
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  // Fetch players for dropdown
  useEffect(() => {
    const requestOptions: RequestInit = {
      method: "GET",
    };
    if (JWT_STORAGE === "cookie") {
      requestOptions.credentials = "include";
    } else if (JWT_STORAGE === "localstorage") {
      requestOptions.headers = {
        Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
      };
    }

    fetch(`${API_URL}/players`, requestOptions)
      .then((response) => response.json())
      .then((data: Player[]) => {
        setPlayers(data);
      })
      .catch((error) => {
        console.error("Error fetching players:", error);
      });
  }, []);
  const endpoints = [
    { endpoint: "totHours", title: "Total Hours", filters: [filterTypeOptions.startDate, filterTypeOptions.endDate] },
    { endpoint: "totMatches", title: "Total Matches", filters: [filterTypeOptions.startDate, filterTypeOptions.endDate] },
    { endpoint: "playerWins", title: "Player Wins", filters: [filterTypeOptions.player, filterTypeOptions.startDate, filterTypeOptions.endDate] },
    { endpoint: "playerWinRate", title: "Player Win Rate", filters: [filterTypeOptions.player, filterTypeOptions.startDate, filterTypeOptions.endDate] },
    { endpoint: "playerHighestWinRate", title: "Player Highest Win Rate", filters: [filterTypeOptions.month, filterTypeOptions.year] },
    { endpoint: "playerGameWins", title: "Player Game Wins", filters: [filterTypeOptions.player] },
    { endpoint: "gameCoopWinRate", title: "Game Coop Win Rate", filters: [filterTypeOptions.game] },
    { endpoint: "gameNumMatch", title: "Game Number of Matches" },
    { endpoint: "gameAvgDuration", title: "Game Average Duration" },
    { endpoint: "gameBestValue", title: "Game Best Value" },
    { endpoint: "gameHighestScore", title: "Game Highest Score", filters: [filterTypeOptions.game] },
    { endpoint: "gameAvgScore", title: "Game Average Score", filters: [filterTypeOptions.game] },
    // Add more endpoints as needed
  ];

  // Group endpoints by categories for better organization
  const playerStats = endpoints.filter(item => item.endpoint.startsWith('player'));
  const gameStats = endpoints.filter(item => item.endpoint.startsWith('game'));
  const globalStats = endpoints.filter(item => !item.endpoint.startsWith('player') && !item.endpoint.startsWith('game'));


  return (
    <Container size="xl" className="!py-6">
      {/* Player Selection Header */}
      <div className="!mb-6 !bg-gray-50 !p-4 !rounded-lg !border !border-gray-100">
        <Group justify="space-between" align="center" className="!flex-wrap">
          <Title order={2} className="!text-gray-800 !mb-0 !font-semibold !text-xl">
            Achievements
          </Title>

          <Group>
            <Select
              placeholder="Select Player"
              value={selectedUsername}
              onChange={setSelectedUsername}
              data={players.map(player => ({ value: player.username, label: player.username }))}
              clearable
              searchable
              className="!min-w-[200px]"
              leftSection={<IconUser size={16} />}
              classNames={{
                input: "!border-gray-200 !text-gray-700",
                dropdown: "!border-gray-100 !shadow-md"
              }}
            />
            <Button
              variant="light"
              color="gray"
              onClick={() => setSelectedUsername(null)}
              className="!text-gray-600 !bg-gray-100 hover:!bg-gray-200"
            >
              My Achievements
            </Button>
          </Group>
        </Group>
      </div>

      {/* Achievement Card - passing the selected username */}
      <PlayerAchievementCard username={selectedUsername} />
      {/* Global Statistics */}
      <div className="!mb-8">
        <Title order={2} className="!text-gray-800 !mb-4 !font-semibold !text-xl">
          Global Statistics
        </Title>
        <Text className="!text-gray-600 !mb-4">
          Overview of all gaming activity across MeepleStats
        </Text>
        <Grid>
          {globalStats.map((item, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <StatisticCard endpoint={item.endpoint} title={item.title} filters={item.filters} />
            </Grid.Col>
          ))}
        </Grid>
      </div>

      {/* Player Statistics */}
      <div className="!mb-8">
        <Title order={2} className="!text-gray-800 !mb-4 !font-semibold !text-xl">
          Player Statistics
        </Title>
        <Text className="!text-gray-600 !mb-4">
          Performance metrics for individual players
        </Text>
        <Grid>
          {playerStats.map((item, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <StatisticCard endpoint={item.endpoint} title={item.title} filters={item.filters} />
            </Grid.Col>
          ))}
        </Grid>
      </div>

      {/* Game Statistics */}
      <div>
        <Title order={2} className="!text-gray-800 !mb-4 !font-semibold !text-xl">
          Game Statistics
        </Title>
        <Text className="!text-gray-600 !mb-4">
          Metrics about specific games in your collection
        </Text>
        <Grid>
          {gameStats.map((item, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <StatisticCard endpoint={item.endpoint} title={item.title} filters={item.filters} />
            </Grid.Col>
          ))}
        </Grid>
      </div>
    </Container>
  );
}