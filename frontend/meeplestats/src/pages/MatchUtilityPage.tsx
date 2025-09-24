import { useEffect, useState } from 'react';
import { Wheel } from 'react-custom-roulette'
import { Game } from '../model/Interfaces';
import { API_URL, JWT_STORAGE } from '../model/Constants';
import { Box, Button, Paper, Select, Stack, Title, Text, Group, Container, Grid, Divider, List, useMantineColorScheme } from '@mantine/core';
import { useStopwatch } from 'react-timer-hook';
import RootCounter from '../components/RootCounter';
import { useTranslation } from 'react-i18next';

const MatchUtilityPage = () => {
  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [games, setGames] = useState<Game[]>([]);
  const [mustSpin, setMustSpin] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [wheelGames, setWheelGames] = useState<Game[]>([]);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [wheelData, setWheelData] = useState<{ option: string }[]>([{ option: 'Add a Game!' }]);
  const { t } = useTranslation();


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
      <Paper
        p="md"
        withBorder
        style={{
          backgroundColor: isDarkMode ? "#1f2937" : "white",
          borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
        }}
      >
        <Stack>
          <Title
            order={3}
            c={isDarkMode ? "gray.1" : "gray.9"}
          >
            {t("StopwatchTitle", { defaultValue: "Stopwatch" })}
          </Title>
          <Box
            style={{
              fontSize: '2rem',
              fontFamily: 'monospace',
              textAlign: 'center',
              color: isDarkMode ? "#f3f4f6" : "#1f2937"
            }}
          >
            <span>{String(hours).padStart(2, '0')}</span>:
            <span>{String(minutes).padStart(2, '0')}</span>:
            <span>{String(seconds).padStart(2, '0')}</span>
          </Box>
          <Text
            size="sm"
            c={isRunning ? "green" : (isDarkMode ? "gray.4" : "gray")}
            ta={"center"}
          >
            {isRunning ? t("StopwatchRunning", { defaultValue: "Running" }) : t("StopwatchNotRunning", { defaultValue: "Not running" })}
          </Text>
          <Group grow>
            <Button
              onClick={start}
              disabled={isRunning}
              className={`!transition-colors !font-medium ${isDarkMode
                ? "!bg-green-700 !text-green-200 hover:!bg-green-600"
                : "!bg-green-50 !text-green-600 hover:!bg-green-100"
                }`}
            >
              {t("StopwatchStart", { defaultValue: "Start" })}
            </Button>
            <Button
              onClick={pause}
              disabled={!isRunning}
              className={`!transition-colors !font-medium ${isDarkMode
                ? "!bg-yellow-700 !text-yellow-200 hover:!bg-yellow-600"
                : "!bg-yellow-50 !text-yellow-600 hover:!bg-yellow-100"
                }`}
            >
              {t("StopwatchPause", { defaultValue: "Pause" })}
            </Button>
            <Button
              onClick={() => reset()}
              className={`!transition-colors !font-medium ${isDarkMode
                ? "!bg-red-700 !text-red-200 hover:!bg-red-600"
                : "!bg-red-50 !text-red-600 hover:!bg-red-100"
                }`}
            >
              {t("StopwatchReset", { defaultValue: "Reset" })}
            </Button>
          </Group>
        </Stack>
      </Paper>
    );
  }


  return (
    <Container size="xl" py="md">
      <Grid gutter="md">
        <Grid.Col span={12}>
          <Title
            order={1}
            ta="center"
            mb="lg"
            c={isDarkMode ? "gray.1" : "gray.9"}
          >
            {t("GameSelectorUtilitiesTitle", { defaultValue: "Game Selector Utilities" })}
          </Title>
        </Grid.Col>

        {/* Left Column - Game Selection & Wheel Games List */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper
            p="md"
            withBorder
            style={{
              backgroundColor: isDarkMode ? "#1f2937" : "white",
              borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
            }}
          >
            <Stack>
              <Title
                order={3}
                c={isDarkMode ? "gray.1" : "gray.9"}
              >
                {t("UtilitySelectGamesTitle", { defaultValue: "Select Games" })}
              </Title>

              <Select
                label={t("UtilitySelectGameLabel", { defaultValue: "Select a game to add" })}
                placeholder={t("UtilitySelectGamePlaceholder", { defaultValue: "Pick one" })}
                data={games.map((game) => ({ value: game.bgg_id, label: game.name }))}
                value={selectedGame}
                onChange={(value) => setSelectedGame(value)}
                searchable
                clearable
                styles={{
                  input: {
                    backgroundColor: isDarkMode ? "#374151" : "white",
                    borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                    color: isDarkMode ? "#f3f4f6" : "#1f2937",
                    "&:focus": {
                      borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                    },
                  },
                  label: {
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

              <Button
                onClick={handleAddGame}
                disabled={!selectedGame}
                fullWidth
                className={`!transition-colors !font-medium ${isDarkMode
                  ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
                  : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
                  }`}
              >
                {t("UtilityAddToWheel", { defaultValue: "Add to Wheel" })}
              </Button>

              <Divider
                label={t("UtilityGamesInWheel", { defaultValue: "Games in Wheel" })}
                labelPosition="center"
                style={{
                  borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                }}
              />

              {wheelGames.length > 0 ? (
                <List>
                  {wheelGames.map((game, index) => (
                    <List.Item key={index} className="mb-2">
                      <Group justify="apart">
                        <Text c={isDarkMode ? "gray.1" : "gray.9"}>{game.name}</Text>
                        <Button
                          variant="subtle"
                          color="red"
                          onClick={() => handleRemoveGame(game)}
                          className={`!transition-colors !font-medium ${isDarkMode
                            ? "!bg-red-800 !text-red-200 hover:!bg-red-700"
                            : "!bg-red-50 !text-red-600 hover:!bg-red-100"
                            }`}
                        >
                          {t("UtilityRemove", { defaultValue: "Remove" })}
                        </Button>
                      </Group>
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Text c={isDarkMode ? "gray.4" : "dimmed"} ta="center">{t("UtilityNoGamesAdded", { defaultValue: "No games added yet" })}</Text>
              )}
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Right Column - Wheel & Stopwatch */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack>
            <Paper
              p="md"
              withBorder
              style={{
                backgroundColor: isDarkMode ? "#1f2937" : "white",
                borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
              }}
            >
              <Stack align="center">
                <Title
                  order={3}
                  ta="center"
                  c={isDarkMode ? "gray.1" : "gray.9"}
                >
                  {t("UtilityGameWheelTitle", { defaultValue: "Game Wheel" })}
                </Title>

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
                    className={`!transition-colors !font-medium ${isDarkMode
                      ? "!bg-blue-700 !text-blue-200 hover:!bg-blue-600"
                      : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
                      }`}
                  >
                    {t("UtilitySpinTheWheel", { defaultValue: "Spin the Wheel" })}
                  </Button>
                </Group>

                {!mustSpin && wheelGames.length > 0 && (
                  <Box mt="md">
                    <Title order={3} ta="center" c="green">
                      {t("UtilitySelectedGame", { defaultValue: "Selected" })}: {wheelGames[prizeNumber].name}
                    </Title>
                  </Box>
                )}
              </Stack>
            </Paper>

            <MyStopwatch />
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Root Counter with proper spacing */}
      <Title
        order={2}
        mb="md"
        mt="xl"
        c={isDarkMode ? "gray.1" : "gray.9"}
      >
        {t("UtilityGameBalanceTools", { defaultValue: "Game Balance Tools" })}
      </Title>
      <RootCounter />

    </Container>
  );
}

export default MatchUtilityPage;