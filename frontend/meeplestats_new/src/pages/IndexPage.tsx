import { Skeleton, Card, Grid } from "@mantine/core";
import StatisticCard from "../components/StatisticCard"; // Adjust the path as necessary

export default function IndexPage() {
  const endpoints = [
    { endpoint: "totHours", title: "Total Hours", filters: [{ label: "Start Date", value: "start_date", type: "date" as const }, { label: "End Date", value: "end_date", type: "date" as const }] },
    { endpoint: "totMatches", title: "Total Matches" },
    { endpoint: "playerWins", title: "Player Wins" },
    { endpoint: "playerWinRate", title: "Player Win Rate" },
    { endpoint: "playerHighestWinRate", title: "Player Highest Win Rate" },
    { endpoint: "playerGameWins", title: "Player Game Wins" },
    { endpoint: "gameCoopWinRate", title: "Game Coop Win Rate" },
    { endpoint: "gameNumMatch", title: "Game Number of Matches" },
    { endpoint: "gameAvgDuration", title: "Game Average Duration" },
    { endpoint: "gameBestValue", title: "Game Best Value" },
    { endpoint: "gameHighestScore", title: "Game Highest Score" },
    { endpoint: "gameAvgScore", title: "Game Average Score" },
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