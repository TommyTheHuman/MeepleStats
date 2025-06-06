import { useEffect, useState } from "react";
import { Game } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { ActionIcon, Box, Button, Container, Divider, Grid, Group, LoadingOverlay, Paper, ScrollArea, Select, Stack, TextInput, Title } from "@mantine/core";
import { IconPlus, IconTrash, IconDownload } from "@tabler/icons-react";
import { showNotification } from "@mantine/notifications";
import { useMediaQuery } from "@mantine/hooks";

const ScoreSheetCreator = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  const [generalInfo, setGeneralInfo] = useState({
    game_id: "",
    game_name: "",
    game_description: "",
  });

  const [fields, setFields] = useState<{ label: string; type: string; weight: number; rule: string }[]>([]);

  const handleGameSelect = (gameName: string) => {
    const selectedGame = games.find((game) => game.name === gameName);
    if (selectedGame) {
      setGeneralInfo({
        game_id: selectedGame.bgg_id,
        game_name: selectedGame.name,
        game_description: ""
      });
    }
  }

  // Fetch games for the dropdown menu
  useEffect(() => {
    const fetchGames = async () => {
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
        setLoading(true);
        const response = await fetch(`${API_URL}/games`, requestOptions);
        setLoading(false);
        const data: Game[] = await response.json();
        const sortedGames = data.sort((a, b) => a.name.localeCompare(b.name));
        setGames(sortedGames);
      } catch (err) {
        console.error("Error fetching games:", err);
      }
    };

    fetchGames();
  }, []);

  const addField = () => {
    setFields((prevFields) => [...prevFields, { label: "", type: "number", weight: 1, rule: "" }]);
  }

  const removeField = (index: number) => {
    setFields((prevFields) => prevFields.filter((_, i) => i !== index));
  }

  const updateField = (index: number, field: keyof typeof fields[0], value: string | number) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    setFields(updatedFields);
  }

  const generateJSON = () => {
    return {
      ...generalInfo,
      fields: fields,
      calculation: {
        type: "sum",
        formula: null
      }

    }
  }

  const downloadJSON = () => {
    const json = generateJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${generalInfo.game_name}_score_sheet.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleUpload = async () => {
    setLoading(true);
    try {

      const requestOptions: RequestInit = {
        method: "POST",
      };

      if (JWT_STORAGE === "cookie") {
        requestOptions.credentials = "include";
        requestOptions.headers = {
          "Content-Type": "application/json",
        };
      } else if (JWT_STORAGE === "localstorage") {
        requestOptions.headers = {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
          "Content-Type": "application/json",
        };
      }

      requestOptions.body = JSON.stringify(generateJSON());

      const response = await fetch(`${API_URL}/upload-scoreSheet`, requestOptions);
      setLoading(false);
      if (response.ok) {
        showNotification({
          title: "Success",
          message: "Score sheet uploaded successfully!",
          color: "green",
        });
      } else {
        showNotification({
          title: "Error",
          message: "Failed to upload score sheet.",
          color: "red",
        });
      }
    } catch (err) {
      console.error("Error uploading score sheet:", err);
      setLoading(false);
    }
  }

  return (
    <Container size="xl" py="md" px={isMobile ? "xs" : "md"}>
      <Title order={1} className="!mb-6 !text-gray-800 !text-2xl !font-bold">
        Score Sheet Creator
      </Title>

      <Grid gutter={isMobile ? "xs" : "md"}>
        {/* Form Column - Full width on mobile, half width on desktop */}
        <Grid.Col span={isMobile ? 12 : 6}>
          <Paper p={isMobile ? "sm" : "md"} radius="md" className="!bg-white !shadow-sm !mb-4">
            <Box pos="relative">
              <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "md", blur: 2 }} />

              <Title order={3} className="!mb-4 !text-gray-800 !text-lg !font-semibold">
                Game Details
              </Title>

              <Select
                label="Select Game"
                placeholder="Choose a game from your collection"
                data={games.map((game) => ({ value: game.name, label: game.name }))}
                onChange={(value) => {
                  if (value) {
                    handleGameSelect(value);
                  }
                }}
                value={generalInfo.game_name}
                required
                searchable
                className="!mb-4"
                styles={{
                  input: { borderRadius: "0.75rem" },
                  label: { fontWeight: 500, fontSize: "0.875rem" }
                }}
              />

              <TextInput
                label="Description"
                value={generalInfo.game_description}
                onChange={(e) => setGeneralInfo({ ...generalInfo, game_description: e.target.value })}
                placeholder="Enter a description for this score sheet"
                className="!mb-4"
                styles={{
                  input: { borderRadius: "0.75rem" },
                  label: { fontWeight: 500, fontSize: "0.875rem" }
                }}
              />
            </Box>
          </Paper>

          <Paper p={isMobile ? "sm" : "md"} radius="md" className="!bg-white !shadow-sm !mb-4">
            <Box pos="relative">
              <Title order={3} className="!mb-4 !text-gray-800 !text-lg !font-semibold">
                Score Fields
              </Title>

              <Box className="!text-gray-600 !mb-4" style={{ fontSize: '0.875rem' }}>
                Add fields to track different scoring elements for your game.
              </Box>

              <Button
                onClick={addField}
                className="!bg-blue-600 hover:!bg-blue-700 !transition-colors !mb-4"
                radius="md"
                leftSection={<IconPlus size={16} />}
                fullWidth
              >
                Add New Field
              </Button>

              {fields.length > 0 && (
                <Box className="!mb-4">
                  <Divider label="Scoring Fields" labelPosition="center" className="!mb-4 !opacity-60" />

                  {fields.map((field, index) => (
                    <Paper
                      key={index}
                      p={isMobile ? "xs" : "sm"}
                      mb="sm"
                      radius="md"
                      className="!bg-gray-50 !border !border-gray-100"
                    >
                      {/* Use the same Stack layout for both mobile and desktop */}
                      <Stack gap={isMobile ? "xs" : "sm"}>
                        <TextInput
                          label="Field Label"
                          value={field.label}
                          onChange={(e) => updateField(index, "label", e.target.value)}
                          placeholder="e.g., Victory Points"
                          styles={{
                            input: { borderRadius: "0.75rem" },
                            label: { fontWeight: 500, fontSize: "0.875rem" }
                          }}
                        />

                        <Grid>
                          <Grid.Col span={isMobile ? 6 : 6}>
                            <Select
                              label="Type"
                              value={field.type}
                              onChange={(value) => updateField(index, "type", value || "number")}
                              data={[
                                { value: "number", label: "Number" },
                                { value: "text", label: "Text" }
                              ]}
                              styles={{
                                input: { borderRadius: "0.75rem" },
                                label: { fontWeight: 500, fontSize: "0.875rem" }
                              }}
                            />
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 6 : 6}>
                            <TextInput
                              label="Weight"
                              type="number"
                              value={field.weight.toString()}
                              onChange={(e) => updateField(index, "weight", parseFloat(e.target.value) || 0)}
                              placeholder="1"
                              styles={{
                                input: { borderRadius: "0.75rem" },
                                label: { fontWeight: 500, fontSize: "0.875rem" }
                              }}
                            />
                          </Grid.Col>
                        </Grid>

                        <TextInput
                          label="Rule"
                          value={field.rule}
                          onChange={(e) => updateField(index, "rule", e.target.value)}
                          placeholder="e.g., Highest wins"
                          styles={{
                            input: { borderRadius: "0.75rem" },
                            label: { fontWeight: 500, fontSize: "0.875rem" }
                          }}
                        />

                        <Group justify="flex-end">
                          <ActionIcon
                            color="red"
                            onClick={() => removeField(index)}
                            variant={isMobile ? "filled" : "subtle"}
                            size={isMobile ? "md" : "lg"}
                            radius="md"
                          >
                            <IconTrash size={isMobile ? 16 : 18} />
                          </ActionIcon>
                        </Group>
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              )}

              {fields.length > 0 && (
                <Group grow>
                  <Button
                    onClick={downloadJSON}
                    className="!bg-green-600 hover:!bg-green-700 !transition-colors"
                    radius="md"
                    leftSection={<IconDownload size={16} />}
                    size={isMobile ? "sm" : "md"}
                  >
                    Download
                  </Button>
                  <Button
                    onClick={handleUpload}
                    className="!bg-blue-600 hover:!bg-blue-700 !transition-colors"
                    radius="md"
                    leftSection={<IconPlus size={16} />}
                    size={isMobile ? "sm" : "md"}
                  >
                    Upload
                  </Button>
                </Group>
              )}
            </Box>
          </Paper>
        </Grid.Col>

        {/* Preview Column - Full width on mobile, half width on desktop */}
        <Grid.Col span={isMobile ? 12 : 6}>
          <Paper p={isMobile ? "sm" : "md"} radius="md" className="!bg-white !shadow-sm" style={!isMobile ? { position: "sticky", top: "1rem" } : {}}>
            <Title order={3} className="!mb-4 !text-gray-800 !text-lg !font-semibold">
              JSON Preview
            </Title>

            <ScrollArea h={isMobile ? 300 : 600} scrollbarSize={6}>
              <Paper
                p={isMobile ? "xs" : "md"}
                radius="md"
                className="!bg-gray-50 !border !border-gray-100 !overflow-auto"
                style={{ fontFamily: 'monospace' }}
              >
                <pre className="!text-xs md:!text-sm !text-gray-700 !whitespace-pre-wrap">
                  {JSON.stringify(generateJSON(), null, 2)}
                </pre>
              </Paper>
            </ScrollArea>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>


  );
}

export default ScoreSheetCreator;