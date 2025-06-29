import { useEffect, useRef, useState } from "react";
import { Faction } from "../model/Interfaces";
import { Badge, Box, Checkbox, Grid, Group, Paper, Stack, Text, Title, useMantineColorScheme } from "@mantine/core";
import * as Plot from "@observablehq/plot";


const viable = [
  { players: 2, reach: 17 },
  { players: 3, reach: 18 },
  { players: 4, reach: 21 },
  { players: 5, reach: 25 },
  { players: 6, reach: 28 }
]

const RootCounter = () => {
  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [selectedFactions, setSelectedFactions] = useState<Faction[]>([]);
  const plotRef = useRef<HTMLDivElement>(null);

  const factions: Faction[] = [
    { name: "Marquise de Cat", reach: 10, color: "#c67848" },
    { name: "Lord of the Hundreds", reach: 9, color: "#bd3543" },
    { name: "Keepers in Iron", reach: 8, color: "#828382" },
    { name: "Underground Duchy", reach: 8, color: "#e1c4aa" },
    { name: "Eyrie Dynasties", reach: 7, color: "#496499" },
    { name: "Vagabond (1st)", reach: 5, color: "#636463" },
    { name: "Vagabond (2nd)", reach: 2, color: "#636463" },
    { name: "Riverfolk Company", reach: 5, color: "#76bab0" },
    { name: "Woodland Alliance", reach: 3, color: "#74ad5d" },
    { name: "Corvid Conspiracy", reach: 3, color: "#7e588f" },
    { name: "Lizard Cult", reach: 2, color: "#f8ef7c" }
  ]




  useEffect(() => {
    const container = plotRef.current;
    if (!container) return;

    const totalReach = selectedFactions.reduce((sum, f) => sum + f.reach, 0);
    const width = container.clientWidth || 600;

    const currentPlayers = selectedFactions.length;

    const plot = Plot.plot({
      width,
      marginTop: 20,
      marginRight: 30,
      x: { grid: true, label: "Reach" },
      y: { domain: [0, 1], axis: null },
      marks: [
        Plot.barX(selectedFactions, {
          x: "reach",
          fill: "color",
          y: () => 0,
          title: d => `${d.name}: ${d.reach}`
        }),
        Plot.ruleX([0]),
        Plot.ruleX(viable, {
          x: "reach",
          strokeDasharray: "4 2",
          strokeOpacity: (d: { players: number; reach: number }) => (d.players === currentPlayers ? 1 : 0.1),
        }),
        Plot.text(viable, {
          x: "reach",
          text: (d: { players: number; reach: number }) =>
            d.players === currentPlayers ? `${d.players} players` : d.players,
          textAnchor: "start",
          frameAnchor: "top",
          dx: 2,
          dy: -12,
          fill: (d: { players: number; reach: number }) =>
            d.players === currentPlayers && d.reach > totalReach
              ? "firebrick"
              : "black",
          fillOpacity: (d: { players: number; reach: number }) => (d.players === currentPlayers ? 1 : 0.1),
        }),
      ],
    });

    container.innerHTML = "";
    container.append(plot);
    return () => {
      if (container.contains(plot)) {
        container.removeChild(plot);
      }
    };
  }, [selectedFactions]);

  const toggleFaction = (faction: Faction) => {
    setSelectedFactions(prev => prev.some(f => f.name === faction.name) ? prev.filter(f => f.name !== faction.name) : [...prev, faction])
  }

  const totalReach = selectedFactions.reduce((sum, f) => sum + f.reach, 0);
  const currentPlayers = selectedFactions.length;
  const targetReach = viable.find(v => v.players === currentPlayers)?.reach || 0;
  const isBalanced = currentPlayers > 0 && totalReach >= targetReach;



  return (
    <Paper
      p="md"
      withBorder
      radius="md"
      className="!shadow-sm !mb-6"
      style={{
        backgroundColor: isDarkMode ? "#1f2937" : "white",
        borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
      }}
    >
      <Title
        order={3}
        className="!mb-4 !text-lg !font-semibold"
        c={isDarkMode ? "gray.1" : "gray.8"}
      >
        Root Game Balance Calculator
      </Title>

      <Grid>
        <Grid.Col span={{ base: 12, sm: 5 }}>
          <Paper
            p="sm"
            radius="md"
            className="!border"
            style={{
              backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
              borderColor: isDarkMode ? "#9ca3af" : "#e5e7eb",
            }}
          >
            <Text
              fw={600}
              size="sm"
              className="!mb-3"
              c={isDarkMode ? "gray.1" : "gray.7"}
            >
              Select Factions
            </Text>

            {factions.map(f => (
              <Checkbox
                key={f.name}
                checked={selectedFactions.some(sf => sf.name === f.name)}
                label={
                  <Group gap="xs">
                    <Box
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: f.color,
                        borderRadius: 2,
                      }}
                    />
                    <Text size="sm">{f.name}</Text>
                    <Badge
                      size="sm"
                      variant="light"
                      style={{
                        backgroundColor: isDarkMode ? "#4b5563" : "#e5e7eb",
                        color: isDarkMode ? "#d1d5db" : "#6b7280",
                      }}
                    >
                      {f.reach}
                    </Badge>
                  </Group>
                }
                onChange={() => toggleFaction(f)}
                className="!mb-2"
                styles={{
                  input: {
                    cursor: 'pointer',
                    backgroundColor: isDarkMode ? "#4b5563" : "white",
                    borderColor: isDarkMode ? "#9ca3af" : "#d1d5db",
                  },
                  label: {
                    color: isDarkMode ? "#f3f4f6" : "#1f2937",
                  }
                }}
              />
            ))}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 7 }}>
          <Stack>
            <Group justify="space-between">
              <Title
                order={4}
                className="!font-semibold"
                c={isDarkMode ? "gray.1" : "gray.7"}
              >
                Reach Chart
              </Title>

              <Group>
                <Badge
                  color={isBalanced ? "green" : "red"}
                  variant="filled"
                  size="lg"
                >
                  {currentPlayers > 0 ? (
                    isBalanced ? "Balanced" : "Unbalanced"
                  ) : "Select factions"}
                </Badge>

                {currentPlayers > 0 && (
                  <Text
                    size="sm"
                    fw={500}
                    c={isDarkMode ? "gray.3" : "gray.6"}
                  >
                    Total Reach: {totalReach}/{targetReach}
                  </Text>
                )}
              </Group>
            </Group>

            <Paper
              p="md"
              radius="md"
              className="!border !min-height-[200px]"
              style={{
                backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                borderColor: isDarkMode ? "#9ca3af" : "#e5e7eb",
              }}
            >
              {selectedFactions.length > 0 ? (
                <div ref={plotRef} style={{ width: "100%" }} />
              ) : (
                <Text ta="center" c={isDarkMode ? "gray.4" : "dimmed"} py="xl">
                  Select factions to visualize game balance
                </Text>
              )}
            </Paper>

            <Text size="xs" c={isDarkMode ? "gray.4" : "dimmed"} ta="center">
              Select multiple factions to check if their combined reach is balanced for your player count.
            </Text>
          </Stack>
        </Grid.Col>
      </Grid>
    </Paper>
  );
};

export default RootCounter;