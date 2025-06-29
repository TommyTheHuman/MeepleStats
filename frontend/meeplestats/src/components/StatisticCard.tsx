import { useEffect, useState } from "react";
import { Game, Player, StaticResponse, StatisticCardInterface } from "../model/Interfaces";
import { fetchStatistics } from "../api/statisticApi";
import { Badge, Card, Group, Loader, Paper, RingProgress, Select, Stack, Text, TextInput, useMantineColorScheme } from "@mantine/core";
import { DateInput, DateValue, MonthPickerInput, YearPickerInput } from "@mantine/dates";
import { IconChartBar, IconTrophy } from "@tabler/icons-react";
import { API_URL, FilterTypes, JWT_STORAGE } from "../model/Constants";


const StatisticCard = ({ endpoint, title, filters }: StatisticCardInterface) => {

  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [data, setData] = useState<StaticResponse | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // Fetch games and players data for filter options
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

  useEffect(() => {
    fetch(`${API_URL}/players`)
      .then((response) => response.json())
      .then((data: Player[]) => {
        const sortedPlayers = data.sort((a, b) =>
          a.username.localeCompare(b.username)
        );
        setPlayers(sortedPlayers);
      })
      .catch((error) => console.error("Error fetching players:", error));
  }, []);


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Filter out any empty values from the filterValues object
        Object.keys(filterValues).forEach((key) => (filterValues[key] === "" && delete filterValues[key]));
        const result = await fetchStatistics(endpoint, filterValues);
        setData(result);
        setError(null);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(String(error));
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [endpoint, filterValues]);

  const renderData = () => {
    if (!data) return <Text className="!text-center !text-gray-500 !py-6">No data available</Text>;

    if (data.type === "number") {
      return (
        <Stack className="!py-4 !items-center">
          <Text className="!text-xs !text-gray-500 !uppercase !tracking-wider !text-center">
            {data.description || ''}
          </Text>
          <Text className="!text-3xl !font-bold !text-blue-600 !text-center">
            {typeof data.value === 'number' ? data.value.toLocaleString() : String(data.value)}
          </Text>
          {data.unit && (
            <Badge variant="light" color="blue" className="!bg-blue-50 !text-blue-600 !border-0">
              {data.unit}
            </Badge>
          )}
        </Stack>
      );
    }

    if (data.type === "percentage") {
      const percentValue = typeof data.value === 'number' ? data.value : 0;

      return (
        <Stack className="!py-4 !items-center">
          <Text className="!text-xs !text-gray-500 !uppercase !tracking-wider !text-center !mb-2">
            {data.description || ''}
          </Text>
          <RingProgress
            size={120}
            thickness={12}
            roundCaps
            sections={[{ value: percentValue, color: 'blue' }]}
            label={
              <Text className="!text-xl !font-bold !text-center">
                {percentValue.toFixed(1)}%
              </Text>
            }
          />
        </Stack>
      );
    }

    if (data.type === "list" && Array.isArray(data.value)) {
      return (
        <Stack className="!py-2 !px-1">
          <Text className="!text-xs !text-gray-500 !uppercase !tracking-wider !mb-1">
            {data.description || ''}
          </Text>
          {data.value.map((item, index) => (
            <Paper key={index} p="xs" withBorder radius="md" className={isDarkMode ? "!bg-gray-700 !border-gray-600" : "!bg-white !border-gray-100"}>
              {Object.entries(item).map(([key, value]) => (
                key !== "_id" && key !== "status" && (
                  <Group key={key} className="!py-1">
                    <Text className={`!capitalize !font-medium ${isDarkMode ? "!text-gray-300" : "!text-gray-700"}`}>
                      {key.replace(/_/g, " ")}:
                    </Text>
                    <Text className={isDarkMode ? "!text-gray-100" : "!text-gray-900"}>
                      {typeof value === 'number' && key.toLowerCase().includes('rate')
                        ? `${value.toFixed(1)}%`
                        : String(value)}
                    </Text>
                  </Group>
                )
              ))}
            </Paper>
          ))}
        </Stack>
      );
    }

    if (data.type === "comparison" && Array.isArray(data.value) && data.value.length === 2) {
      const bestItem = data.value[0];
      const worstItem = data.value[1];

      return (
        <Stack className="!py-2">
          <Text className="!text-xs !text-gray-500 !uppercase !tracking-wider !mb-1 !text-center">
            {data.description || ''}
          </Text>
          <Paper p="sm" withBorder radius="md" className={isDarkMode ? "!bg-blue-900 !border-blue-700" : "!bg-blue-50 !border-blue-100"}>
            <Group className="!mb-1">
              <Group gap="xs">
                <IconTrophy size={16} className={isDarkMode ? "!text-blue-300" : "!text-blue-600"} />
                <Text className={`!font-medium ${isDarkMode ? "!text-blue-200" : "!text-blue-700"}`}>
                  {bestItem.status === "most" ? "Most Played" : bestItem.status === "best" ? "Best" : "Highest"}
                </Text>
              </Group>
              <Badge variant="filled" color="blue" className={isDarkMode ? "!bg-blue-600 !py-1" : "!bg-blue-600 !py-1"}>
                {bestItem.name}
              </Badge>
            </Group>
            <Text className={`!text-center !text-xl !font-bold !mt-2 ${isDarkMode ? "!text-blue-200" : "!text-blue-700"}`}>
              {bestItem.total_matches || bestItem.total_wins || bestItem.value}
              {data.unit && <span className="!text-sm !font-normal !ml-1">{data.unit}</span>}
            </Text>
          </Paper>

          <Paper p="sm" withBorder radius="md" className={isDarkMode ? "!bg-gray-700 !border-gray-600" : "!bg-gray-50 !border-gray-200"}>
            <Group className="!mb-1">
              <Group gap="xs">
                <IconChartBar size={16} className={isDarkMode ? "!text-gray-400" : "!text-gray-600"} />
                <Text className={`!font-medium ${isDarkMode ? "!text-gray-300" : "!text-gray-700"}`}>
                  {worstItem.status === "least" ? "Least Played" : worstItem.status === "worst" ? "Worst" : "Lowest"}
                </Text>
              </Group>
              <Badge variant="filled" color="gray" className={isDarkMode ? "!bg-gray-500 !py-1" : "!bg-gray-600 !py-1"}>
                {worstItem.name}
              </Badge>
            </Group>
            <Text className={`!text-center !text-xl !font-bold !mt-2 ${isDarkMode ? "!text-gray-300" : "!text-gray-700"}`}>
              {worstItem.total_matches || worstItem.total_wins || worstItem.value}
              {data.unit && <span className="!text-sm !font-normal !ml-1">{data.unit}</span>}
            </Text>
          </Paper>
        </Stack>
      );
    }



    return <Text className="!text-center !text-gray-500 !py-6">No data available</Text>;
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues({ ...filterValues, [key]: value });
  };

  const formatDate = (date: DateValue) => {
    if (date === null) {
      return '';
    } else {
      return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }
  }

  const renderFilters = () => {
    if (!filters || filters.length === 0) return null;

    return (
      <Paper shadow="xs" p="sm" radius="md" className={`mb-3 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
        <Stack gap="xs">
          {filters.map((filter) => {
            if (filter.type === FilterTypes.string && filter.value === "game_name") {
              return (
                <Select
                  key={filter.value}
                  label={filter.label}
                  placeholder="Select a game"
                  data={games.map((game) => ({ value: game.name, label: game.name }))}
                  searchable
                  clearable
                  value={filterValues[filter.value] || ''}
                  onChange={(value) => handleFilterChange(filter.value, value || '')}
                  styles={{
                    root: { marginBottom: 5 },
                    input: {
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                      backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                      color: isDarkMode ? "white" : "black",
                    },
                    label: { color: isDarkMode ? "white" : "black" }
                  }}
                />
              );
            }

            // Player name filter
            else if (filter.type === FilterTypes.string && filter.value === "username") {
              return (
                <Select
                  key={filter.value}
                  label={filter.label}
                  placeholder="Select a player"
                  data={players.map((player) => ({ value: player.username, label: player.username }))}
                  searchable
                  clearable
                  value={filterValues[filter.value] || ''}
                  onChange={(value) => handleFilterChange(filter.value, value || '')}
                  styles={{
                    root: { marginBottom: 5 },
                    input: {
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                      backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                      color: isDarkMode ? "white" : "black",
                    },
                    label: { color: isDarkMode ? "white" : "black" }
                  }}
                />
              );
            }

            // Other string filters (not game or player)
            else if (filter.type === FilterTypes.string) {
              return (
                <TextInput
                  label={filter.label}
                  key={filter.value}
                  onChange={(event) => handleFilterChange(filter.value, event.currentTarget.value)}
                  value={filterValues[filter.value] || ''}
                  styles={{
                    root: { marginBottom: 5 },
                    input: {
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                      backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                      color: isDarkMode ? "white" : "black",
                    },
                    label: { color: isDarkMode ? "white" : "black" }
                  }}
                />
              );
            } else if (filter.type === FilterTypes.date) {
              return (
                <DateInput
                  label={filter.label}
                  key={filter.value}
                  value={filterValues[filter.value] ? new Date(filterValues[filter.value]) : null}
                  onChange={(date) => handleFilterChange(filter.value, formatDate(date))}
                  styles={{
                    root: { marginBottom: 5 },
                    input: { borderRadius: 8 }
                  }}
                />
              );
            } else if (filter.type === FilterTypes.month) {
              return (
                <MonthPickerInput
                  label={filter.label}
                  key={filter.value}
                  valueFormat="MMMM"
                  clearable
                  value={filterValues[filter.value] ? new Date(new Date().getFullYear(), parseInt(filterValues[filter.value]), 1) : null}
                  minDate={new Date(new Date().getFullYear(), 0, 1)}
                  maxDate={new Date(new Date().getFullYear(), 11, 31)}
                  onChange={(date) => handleFilterChange(filter.value, date?.getMonth().toString() || '')}
                  styles={{
                    root: { marginBottom: 5 },
                    input: { borderRadius: 8 }
                  }}
                />
              );
            } else if (filter.type === FilterTypes.year) {
              return (
                <YearPickerInput
                  label={filter.label}
                  key={filter.value}
                  clearable
                  value={filterValues[filter.value] ? new Date(filterValues[filter.value]) : null}
                  onChange={(date) => handleFilterChange(filter.value, date?.getFullYear().toString() || '')}
                  styles={{
                    root: { marginBottom: 5 },
                    input: { borderRadius: 8 }
                  }}
                />
              );
            }
            return null;
          })}
        </Stack>
      </Paper>
    );
  };

  return (
    <Card shadow="sm" padding="xl" className={isDarkMode ? "!bg-gray-800 !border-gray-700" : "!bg-white !border-gray-100"}>
      <Text ta={"center"} fw={600} fz={18} className={isDarkMode ? "!text-white" : "!text-black"}>{title}</Text>
      {renderFilters()}
      {loading ? (
        <Loader />
      ) : error ? (
        <Text c="red">{error}</Text>
      ) : (
        renderData()
      )}

    </Card>
  );
};

export default StatisticCard;