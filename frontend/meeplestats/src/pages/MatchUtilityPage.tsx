import { useEffect, useState } from 'react';
import { Wheel } from 'react-custom-roulette'
import { Game } from '../model/Interfaces';
import { API_URL, JWT_STORAGE } from '../model/Constants';
import { Box, Button, Paper, Select, Stack, Title, Text, Group, Container, Grid, Divider, List } from '@mantine/core';
import { useStopwatch } from 'react-timer-hook';

const MatchUtilityPage = () => {

  const [games, setGames] = useState<Game[]>([]);
  const [mustSpin, setMustSpin] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [wheelGames, setWheelGames] = useState<Game[]>([]);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [wheelData, setWheelData] = useState<{ option: string }[]>([{ option: 'Add a Game!' }]);


  useEffect(() => {
    if (wheelGames.length > 0) {
      const wheelDataNew = wheelGames.map(game => ({
        option: game.name
      }));
      setWheelData(wheelDataNew);
    } else {
      setWheelData([{ option: 'Add a Game!' }]);
    }
  }, [wheelGames]);

  useEffect(() => {
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

    fetch(`${API_URL}/games`, requestOptions)
      .then((response) => response.json())
      .then((data: Game[]) => {
        const sortedGames = data.sort((a, b) => a.name.localeCompare(b.name));
        setGames(sortedGames);
      })
      .catch((error) => console.error("Error fetching games:", error));
  }, []);

  const handleAddGame = () => {
    if (selectedGame) {
      const selectedGameObj = games.find(game => game.bgg_id === selectedGame);
      if (selectedGameObj && !wheelGames.includes(selectedGameObj)) {
        setWheelGames([...wheelGames, selectedGameObj]);
        setSelectedGame(null); // Clear the selected game after adding
      }
    }
  };

  const handleRemoveGame = (gameToRemove: Game) => {
    setWheelGames(wheelGames.filter(game => game.bgg_id !== gameToRemove.bgg_id));
  };

  const handleSpinClick = () => {
    if (wheelGames.length > 0) {
      setMustSpin(true);
      const randomIndex = Math.floor(Math.random() * wheelGames.length);
      setPrizeNumber(randomIndex);
    }
  }

  const handleStopSpinning = () => {
    setMustSpin(false);
  }


  function MyStopwatch() {
    const {
      seconds,
      minutes,
      hours,
      isRunning,
      start,
      pause,
      reset,
    } = useStopwatch({ autoStart: false });


    return (
      <Paper p="md" withBorder>
        <Stack>
          <Title order={3}>Stopwatch</Title>
          <Box style={{ fontSize: '2rem', fontFamily: 'monospace', textAlign: 'center' }}>
            <span>{String(hours).padStart(2, '0')}</span>:
            <span>{String(minutes).padStart(2, '0')}</span>:
            <span>{String(seconds).padStart(2, '0')}</span>
          </Box>
          <Text size="sm" c={isRunning ? "green" : "gray"} ta={"center"}>
            {isRunning ? 'Running' : 'Not running'}
          </Text>
          <Group grow>
            <Button onClick={start} color="green" disabled={isRunning}>Start</Button>
            <Button onClick={pause} color="yellow" disabled={!isRunning}>Pause</Button>
            <Button onClick={() => reset()} color="red">Reset</Button>
          </Group>
        </Stack>
      </Paper>
    );
  }


  return (
    <Container size="xl" py="md">
      <Grid gutter="md">
        <Grid.Col span={12}>
          <Title order={1} ta="center" mb="lg">Game Selector Utilities</Title>
        </Grid.Col>

        {/* Left Column - Game Selection & Wheel Games List */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Stack>
              <Title order={3}>Select Games</Title>

              <Select
                label="Select a game to add"
                placeholder="Pick one"
                data={games.map((game) => ({ value: game.bgg_id, label: game.name }))}
                value={selectedGame}
                onChange={(value) => setSelectedGame(value)}
                searchable
                clearable
              />

              <Button onClick={handleAddGame} disabled={!selectedGame} fullWidth>
                Add to Wheel
              </Button>

              <Divider label="Games in Wheel" labelPosition="center" />

              {wheelGames.length > 0 ? (
                <List>
                  {wheelGames.map((game, index) => (
                    <List.Item key={index} className="mb-2">
                      <Group justify="apart">
                        <Text>{game.name}</Text>
                        <Button
                          variant="subtle"
                          color="red"
                          onClick={() => handleRemoveGame(game)}
                        >
                          Remove
                        </Button>
                      </Group>
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Text color="dimmed" ta="center">No games added yet</Text>
              )}
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Right Column - Wheel & Stopwatch */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack>
            <Paper p="md" withBorder>
              <Stack align="center">
                <Title order={3} ta="center">Game Wheel</Title>

                <Box style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'center' }}>
                  <Wheel
                    mustStartSpinning={mustSpin}
                    prizeNumber={prizeNumber}
                    data={wheelData}
                    textColors={['#ffffff']}
                    onStopSpinning={handleStopSpinning}
                  />
                </Box>

                <Group mt="md">
                  <Button
                    onClick={handleSpinClick}
                    disabled={wheelGames.length === 0}
                    size="lg"
                    color="blue"
                  >
                    Spin the Wheel
                  </Button>
                </Group>

                {!mustSpin && wheelGames.length > 0 && (
                  <Box mt="md">
                    <Title order={3} ta="center" c="green">
                      Selected: {wheelGames[prizeNumber].name}
                    </Title>
                  </Box>
                )}
              </Stack>
            </Paper>

            <MyStopwatch />
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

export default MatchUtilityPage;