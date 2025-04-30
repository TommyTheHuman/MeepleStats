import { useEffect, useState } from "react";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { ActionIcon, Box, Button, Group, Paper, Select, Stack, Table, TextInput, Title, Text } from "@mantine/core";
import { ScoreSheetDataInterface } from "../model/Interfaces";
import { IconInfoCircle, IconTrash } from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";

const ScoreSheet = () => {

  const [scoreSheets, setScoreSheets] = useState<[]>([]);
  const [selectedScoreSheet, setSelectedScoreSheet] = useState<string | null>(null);
  const [scoreSheetData, setScoreSheetData] = useState<ScoreSheetDataInterface>();
  const [columns, setColumns] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState<string>('');
  const [scores, setScores] = useState<{ [key: string]: number[] }>({});
  const [total, setTotal] = useState<{ [key: string]: number }>({});
  const [expandedRules, setExpandedRules] = useState<number[]>([]);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const fetchScoreSheets = async () => {
      try {
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
        const response = await fetch(`${API_URL}/scoreSheets`, requestOptions);

        const data: [] = await response.json();
        setScoreSheets(data);
      } catch (err) {
        console.error("Error fetching score sheets:", err);
      }
    };

    fetchScoreSheets();
  }, []);

  const handleSelectedScoreSheet = (value: string) => {
    setSelectedScoreSheet(value);
  }

  useEffect(() => {
    if (selectedScoreSheet) {
      const fetchScoreSheetData = async () => {
        try {
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
          const response = await fetch(`${API_URL}/scoreSheet/${selectedScoreSheet}`, requestOptions);

          const data = await response.json();
          setScoreSheetData(data);
        } catch (err) {
          console.error("Error fetching score sheet configuration:", err);
        }
      };

      fetchScoreSheetData();
    }
  }, [selectedScoreSheet]);


  const handleAddPlayer = () => {
    if (playerName.trim()) {
      setColumns((prevColumns) => {
        // Only add if not already in the list
        if (!prevColumns.includes(playerName.trim())) {
          return [...prevColumns, playerName.trim()];
        }
        return prevColumns;
      });
    }
  }

  const handleRemoveColumn = (index: number) => {
    const playerName = columns[index];

    setColumns((prevColumns) => prevColumns.filter((_, i) => i !== index));

    setScores(prevScores => {
      const newScores = { ...prevScores };
      delete newScores[playerName];
      return newScores;
    });

    setTotal(prevTotal => {
      const newTotal = { ...prevTotal };
      delete newTotal[playerName];
      return newTotal;
    });
  }

  const handleScoreChange = (playerIndex: number, index: number, value: string) => {
    const playerName = columns[playerIndex];
    const numValue = parseFloat(value) || 0;

    setScores(prevScores => {
      const playerScores = { ...prevScores };
      if (!playerScores[playerName]) {
        playerScores[playerName] = Array(scoreSheetData?.fields.length || 0).fill(0);
      }
      playerScores[playerName][index] = numValue;
      return playerScores;
    });
  }

  const calculateTotal = () => {
    const newTotal: { [key: string]: number } = {};
    columns.forEach(playerName => {
      if (scores[playerName]) {
        newTotal[playerName] = scores[playerName].reduce((sum, score) => sum + score, 0);
      } else {
        newTotal[playerName] = 0;
      }
    });
    setTotal(newTotal);
  }

  const toggleRuleExpansion = (fieldIndex: number) => {
    setExpandedRules(prev =>
      prev.includes(fieldIndex)
        ? prev.filter(i => i !== fieldIndex)
        : [...prev, fieldIndex]
    );
  };

  const renderScoreSheet = () => {
    if (!scoreSheetData) return null;

    return (
      <Stack mt="xl">
        <Title order={2}>{scoreSheetData.game_name}</Title>

        <Group align="flex-end">
          <TextInput
            label="Player Name"
            placeholder="Enter player name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddPlayer();
                setPlayerName('');
              }
            }}
            styles={{
              root: { flexGrow: 1 }
            }}
          />
          <Button onClick={handleAddPlayer} radius="md">
            Add Player
          </Button>
        </Group>

        {columns.length > 0 && (
          <Box style={{ overflowX: 'auto', width: '100%' }}>
            <Table striped highlightOnHover={!isMobile} withColumnBorders>
              <thead>
                <tr>
                  <th style={{ width: '200px' }}>
                    <Text>Scoring Field</Text>
                  </th>
                  {columns.map((player, index) => (
                    <th key={index}>
                      <Group gap="xs" justify="space-between" wrap="nowrap">
                        <Text truncate>{player}</Text>
                        <ActionIcon
                          color="red"
                          size={isMobile ? "md" : "sm"}
                          variant="subtle"
                          onClick={() => handleRemoveColumn(index)}
                        >
                          <IconTrash size={isMobile ? 18 : 16} />
                        </ActionIcon>
                      </Group>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scoreSheetData.fields.map((field, index) => (
                  <>
                    <tr key={index}>
                      <td>
                        <Group gap="xs" wrap="nowrap">
                          <Text>{field.label}</Text>
                          {field.rule && (
                            <ActionIcon
                              size="sm"
                              variant="transparent"
                              onClick={() => toggleRuleExpansion(index)}
                              aria-label="Show scoring rule"
                            >
                              <IconInfoCircle size={16} color="gray" />
                            </ActionIcon>
                          )}
                        </Group>
                      </td>
                      {columns.map((playerName, playerIndex) => (
                        <td key={playerIndex}>
                          <TextInput
                            type="number"
                            placeholder="0"
                            value={scores[playerName]?.[index] || ''}
                            onChange={(e) => handleScoreChange(playerIndex, index, e.target.value)}
                            styles={{
                              input: {
                                textAlign: 'center',
                                width: '100%',
                                minWidth: isMobile ? '60px' : '80px',
                                padding: isMobile ? '8px 4px' : undefined,
                              }
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                    {field.rule && expandedRules.includes(index) && (
                      <tr>
                        <td colSpan={columns.length + 1}>
                          <Box
                            py="xs"
                            px="md"
                            bg="gray.0"
                            style={{ fontSize: isMobile ? '12px' : '14px' }}
                          >
                            <Text size="sm" c="dimmed">{field.rule}</Text>
                          </Box>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                <tr style={{ fontWeight: 'bold' }}>
                  <td>Total</td>
                  {columns.map((playerName, playerIndex) => (
                    <td key={playerIndex} style={{ textAlign: 'center' }}>
                      {total[playerName] || 0}
                    </td>
                  ))}
                </tr>
              </tbody>
            </Table>

            <Group justify="flex-end" mt="lg">
              <Button onClick={calculateTotal} color="blue" radius="md">
                Calculate Total
              </Button>
            </Group>
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <Paper p="md" radius="md" shadow="sm" withBorder>
      <Stack>
        <Title order={1}>Score Sheet</Title>

        <Select
          label="Select Game"
          placeholder="Choose a score sheet"
          data={scoreSheets.map((scoresheet) => ({ value: scoresheet, label: scoresheet }))}
          onChange={(value) => {
            if (value) {
              handleSelectedScoreSheet(value);
            }
          }}
          value={selectedScoreSheet}
          required
          searchable
          styles={{
            root: { maxWidth: '400px' },
            input: { borderRadius: "md" },
            label: { fontWeight: 500, fontSize: "0.875rem", marginBottom: '4px' }
          }}
        />

        {renderScoreSheet()}
      </Stack>
    </Paper>
  );
}

export default ScoreSheet;