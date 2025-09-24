import { useEffect, useState } from "react";
import { Game } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { ActionIcon, Box, Button, Container, Divider, Grid, Group, LoadingOverlay, Paper, ScrollArea, Select, Stack, TextInput, Title, useMantineColorScheme } from "@mantine/core";
import { IconPlus, IconTrash, IconDownload } from "@tabler/icons-react";
import { showNotification } from "@mantine/notifications";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";

const ScoreSheetCreator = () => {
  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();

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
      <Title
        order={1}
        className="!mb-6 !text-2xl !font-bold"
        c={isDarkMode ? "gray.1" : "gray.8"}
      >
        {t("ScoreSheetCreatorTitle", { defaultValue: "Score Sheet Creator" })}
      </Title>

      <Grid gutter={isMobile ? "xs" : "md"}>
        {/* Form Column - Full width on mobile, half width on desktop */}
        <Grid.Col span={isMobile ? 12 : 6}>
          <Paper
            p={isMobile ? "sm" : "md"}
            radius="md"
            className={`!shadow-sm !mb-4 ${isDarkMode ? "!bg-gray-800 !border-gray-700" : "!bg-white !border-gray-200"}`}
            withBorder
          >
            <Box pos="relative">
              <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "md", blur: 2 }} />

              <Title
                order={3}
                className="!mb-4 !text-lg !font-semibold"
                c={isDarkMode ? "gray.1" : "gray.8"}
              >
                {t("ScoreSheetCreatorGameDetailsTitle", { defaultValue: "Game Details" })}
              </Title>

              <Select
                label={t("ScoreSheetCreatorSelectGameLabel", { defaultValue: "Select Game" })}
                placeholder={t("ScoreSheetCreatorSelectGamePlaceholder", { defaultValue: "Choose a game from your collection" })}
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
                  input: {
                    borderRadius: "0.75rem",
                    backgroundColor: isDarkMode ? "#374151" : "white",
                    borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                    color: isDarkMode ? "#f3f4f6" : "#1f2937",
                    "&:focus": {
                      borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                    },
                  },
                  label: {
                    fontWeight: 500,
                    fontSize: "0.875rem",
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

              <TextInput
                label={t("ScoreSheetCreatorDescriptionLabel", { defaultValue: "Description" })}
                value={generalInfo.game_description}
                onChange={(e) => setGeneralInfo({ ...generalInfo, game_description: e.target.value })}
                placeholder={t("ScoreSheetCreatorDescriptionPlaceholder", { defaultValue: "Enter a description for this score sheet" })}
                className="!mb-4"
                styles={{
                  input: {
                    borderRadius: "0.75rem",
                    backgroundColor: isDarkMode ? "#374151" : "white",
                    borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                    color: isDarkMode ? "#f3f4f6" : "#1f2937",
                    "&:focus": {
                      borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                    },
                  },
                  label: {
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    color: isDarkMode ? "#d1d5db" : "#4b5563",
                  }
                }}
              />
            </Box>
          </Paper>

          <Paper
            p={isMobile ? "sm" : "md"}
            radius="md"
            className="!shadow-sm !mb-4"
            style={{
              backgroundColor: isDarkMode ? "#1f2937" : "white",
              borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
            }}
            withBorder
          >
            <Box pos="relative">
              <Title
                order={3}
                className="!mb-4 !text-lg !font-semibold"
                c={isDarkMode ? "gray.1" : "gray.8"}
              >
                {t("ScoreSheetCreatorScoreFieldsTitle", { defaultValue: "Score Fields" })}
              </Title>

              <Box
                className="!mb-4"
                style={{
                  fontSize: '0.875rem',
                  color: isDarkMode ? "#9ca3af" : "#6b7280"
                }}
              >
                {t("ScoreSheetCreatorScoreFieldsDescription", { defaultValue: "Add fields to track different scoring elements for your game." })}
              </Box>

              <Button
                onClick={addField}
                className={`!transition-colors !font-medium !mb-4 ${isDarkMode
                  ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
                  : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
                  }`}
                radius="md"
                leftSection={<IconPlus size={16} />}
                fullWidth
              >
                {t("ScoreSheetCreatorAddNewFieldButton", { defaultValue: "Add New Field" })}
              </Button>

              {fields.length > 0 && (
                <Box className="!mb-4">
                  <Divider
                    label="Scoring Fields"
                    labelPosition="center"
                    className="!mb-4"
                    style={{
                      borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                    }}
                  />

                  {fields.map((field, index) => (
                    <Paper
                      key={index}
                      p={isMobile ? "xs" : "sm"}
                      mb="sm"
                      radius="md"
                      style={{
                        backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                        borderColor: isDarkMode ? "#6b7280" : "#e5e7eb",
                      }}
                      withBorder
                    >
                      {/* Use the same Stack layout for both mobile and desktop */}
                      <Stack gap={isMobile ? "xs" : "sm"}>
                        <TextInput
                          label="Field Label"
                          value={field.label}
                          onChange={(e) => updateField(index, "label", e.target.value)}
                          placeholder="e.g., Victory Points"
                          styles={{
                            input: {
                              borderRadius: "0.75rem",
                              backgroundColor: isDarkMode ? "#4b5563" : "white",
                              borderColor: isDarkMode ? "#9ca3af" : "#d1d5db",
                              color: isDarkMode ? "#f3f4f6" : "#1f2937",
                              "&:focus": {
                                borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                              },
                            },
                            label: {
                              fontWeight: 500,
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#4b5563",
                            }
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
                                input: {
                                  borderRadius: "0.75rem",
                                  backgroundColor: isDarkMode ? "#4b5563" : "white",
                                  borderColor: isDarkMode ? "#9ca3af" : "#d1d5db",
                                  color: isDarkMode ? "#f3f4f6" : "#1f2937",
                                  "&:focus": {
                                    borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                                  },
                                },
                                label: {
                                  fontWeight: 500,
                                  fontSize: "0.875rem",
                                  color: isDarkMode ? "#d1d5db" : "#4b5563",
                                },
                                dropdown: {
                                  backgroundColor: isDarkMode ? "#4b5563" : "white",
                                  borderColor: isDarkMode ? "#9ca3af" : "#d1d5db",
                                },
                                option: {
                                  backgroundColor: isDarkMode ? "#4b5563" : "white",
                                  color: isDarkMode ? "#f3f4f6" : "#1f2937",
                                  "&:hover": {
                                    backgroundColor: isDarkMode ? "#6b7280" : "#f9fafb",
                                  },
                                },
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
                                input: {
                                  borderRadius: "0.75rem",
                                  backgroundColor: isDarkMode ? "#4b5563" : "white",
                                  borderColor: isDarkMode ? "#9ca3af" : "#d1d5db",
                                  color: isDarkMode ? "#f3f4f6" : "#1f2937",
                                  "&:focus": {
                                    borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                                  },
                                },
                                label: {
                                  fontWeight: 500,
                                  fontSize: "0.875rem",
                                  color: isDarkMode ? "#d1d5db" : "#4b5563",
                                }
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
                            input: {
                              borderRadius: "0.75rem",
                              backgroundColor: isDarkMode ? "#4b5563" : "white",
                              borderColor: isDarkMode ? "#9ca3af" : "#d1d5db",
                              color: isDarkMode ? "#f3f4f6" : "#1f2937",
                              "&:focus": {
                                borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                              },
                            },
                            label: {
                              fontWeight: 500,
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#4b5563",
                            }
                          }}
                        />

                        <Group justify="flex-end">
                          <ActionIcon
                            color="red"
                            onClick={() => removeField(index)}
                            variant={isMobile ? "filled" : "subtle"}
                            size={isMobile ? "md" : "lg"}
                            radius="md"
                            style={{
                              backgroundColor: isDarkMode ? "#4b5563" : "#f3f4f6",
                              "&:hover": {
                                backgroundColor: isDarkMode ? "#6b7280" : "#e5e7eb",
                              }
                            }}
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
                    className={`!transition-colors !font-medium ${isDarkMode
                      ? "!bg-green-700 !text-green-100 hover:!bg-green-600"
                      : "!bg-green-50 !text-green-600 hover:!bg-green-100"
                      }`}
                    radius="md"
                    leftSection={<IconDownload size={16} />}
                    size={isMobile ? "sm" : "md"}
                  >
                    {t("ScoreSheetCreatorDownloadButton", { defaultValue: "Download" })}
                  </Button>
                  <Button
                    onClick={handleUpload}
                    className={`!transition-colors !font-medium ${isDarkMode
                      ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
                      : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
                      }`}
                    radius="md"
                    leftSection={<IconPlus size={16} />}
                    size={isMobile ? "sm" : "md"}
                  >
                    {t("ScoreSheetCreatorUploadButton", { defaultValue: "Upload" })}
                  </Button>
                </Group>
              )}
            </Box>
          </Paper>
        </Grid.Col>

        {/* Preview Column - Full width on mobile, half width on desktop */}
        <Grid.Col span={isMobile ? 12 : 6}>
          <Paper
            p={isMobile ? "sm" : "md"}
            radius="md"
            className="!shadow-sm"
            style={{
              backgroundColor: isDarkMode ? "#1f2937" : "white",
              borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
              ...((!isMobile) ? { position: "sticky", top: "1rem" } : {})
            }}
            withBorder
          >
            <Title
              order={3}
              className="!mb-4 !text-lg !font-semibold"
              c={isDarkMode ? "gray.1" : "gray.8"}
            >
              {t("ScoreSheetCreatorJSONPreviewTitle", { defaultValue: "JSON Preview" })}
            </Title>

            <ScrollArea h={isMobile ? 300 : 600} scrollbarSize={6}>
              <Paper
                p={isMobile ? "xs" : "md"}
                radius="md"
                className="!overflow-auto"
                style={{
                  fontFamily: 'monospace',
                  backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                  borderColor: isDarkMode ? "#6b7280" : "#e5e7eb",
                }}
                withBorder
              >
                <pre
                  className="!text-xs md:!text-sm !whitespace-pre-wrap"
                  style={{
                    color: isDarkMode ? "#e5e7eb" : "#4b5563"
                  }}
                >
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