import { Card, Image, Text, Group } from "@mantine/core";
import { MatchCardInterface } from "../model/Interfaces";

const MatchCard = ({ game_name, date, game_duration, game_image, players, winner }: MatchCardInterface) => {
  return (
    <Card shadow="sm" padding="xl" radius="md">
      <Image src={game_image} alt={game_name} height={160} mb="md" />
      <Text fw={500} size="lg">{game_name}</Text>
      <Text>Date: {new Date(date).toLocaleDateString()}</Text>
      <Text>Duration: {game_duration} minutes</Text>
      <Text fw={500} mt="md">Players:</Text>
      {players.map((player, index) => (
        <Group key={index} p="apart">
          <Text fw={player.id === winner.id ? 700 : 400}>{player.name}</Text>
          <Text>{player.score}</Text>
        </Group>
      ))}

    </Card>
  );
};

export default MatchCard;