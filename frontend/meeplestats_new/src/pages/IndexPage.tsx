import { Grid } from "@mantine/core";
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
  return (
    // <Grid>
    //   {Array(15)
    //     .fill(0)
    //     .map((_, index) => (
    //       <Grid.Col key={index} span={{ base: 6, md: 4, lg: 3 }}>
    //         <Card shadow="sm" padding="xl">
    //           <Card.Section>
    //             <Skeleton h={160} animate={false} />
    //           </Card.Section>
    //           <Skeleton h={36} animate={false} mt="md" />
    //           <Skeleton h={26} animate={false} mt="md" />
    //         </Card>
    //       </Grid.Col>
    //     ))}
    // </Grid>
    <Grid>
      {endpoints.map((item, index) => (
        <Grid.Col key={index} span={{ base: 6, md: 4, lg: 3 }}>
          <StatisticCard endpoint={item.endpoint} title={item.title} filters={item.filters} />
        </Grid.Col>
      ))}
    </Grid>
  );
}