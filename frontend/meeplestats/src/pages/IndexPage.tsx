import { Container, Grid, Title, Text } from "@mantine/core";
import StatisticCard from "../components/StatisticCard"; // Adjust the path as necessary
import { FilterTypes } from "../model/Constants";

const filterTypeOptions = {
  startDate: { label: "Start Date", value: "start_date", type: FilterTypes.date },
  endDate: { label: "End Date", value: "end_date", type: FilterTypes.date },
  player: { label: "Player", value: "username", type: FilterTypes.string },
  month: { label: "Month", value: "month", type: FilterTypes.month },
  year: { label: "Year", value: "year", type: FilterTypes.year },
  game: { label: "Game", value: "game_name", type: FilterTypes.string },
}

export default function IndexPage() {
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