import { useEffect, useState } from "react";
import { fetchRulebooks, deleteRulebook, uploadRulebook } from "../api/rulebooksApi";
import { RulebookInterface, Game } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { Container, Title, Paper, Group, Text, Button, FileInput, Autocomplete, LoadingOverlay, Box, Badge, Stack, Card, ActionIcon, Tooltip, Alert, rem, Modal, Grid, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconFileUpload, IconTrash, IconX, IconBook } from "@tabler/icons-react";
import { useContext } from "react";
import { AuthContext } from "../components/AuthContext";
import { useTranslation } from "react-i18next";

const RulebooksPage = () => {
  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [rulebooks, setRulebooks] = useState<RulebookInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const { authStatus } = useContext(AuthContext);
  const { t } = useTranslation();

  const isLoggedIn = authStatus === "LoggedIn";

  // Fetch games for the dropdown
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

        const response = await fetch(`${API_URL}/games`, requestOptions);
        const data: Game[] = await response.json();
        const sortedGames = data.sort((a, b) => a.name.localeCompare(b.name));
        setGames(sortedGames);
      } catch (err) {
        console.error("Error fetching games:", err);
      }
    };

    fetchGames();
  }, []);

  // Fetch rulebooks
  useEffect(() => {
    const loadRulebooks = async () => {
      setLoading(true);
      try {
        const data = await fetchRulebooks();
        console.log('Rulebooks loaded:', data);
        setRulebooks(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load rulebooks:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      loadRulebooks();
    }
  }, [isLoggedIn]);

  const handleUpload = async () => {
    if (!file || !selectedGame) {
      notifications.show({
        title: "Error",
        message: "Please select a game and a PDF file",
        color: "red",
      });
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      notifications.show({
        title: "Error",
        message: "Only PDF files are allowed",
        color: "red",
      });
      return;
    }

    setUploadLoading(true);

    try {
      const response = await uploadRulebook(file, selectedGame.bgg_id, selectedGame.name);
      console.log('Upload response:', response);

      // Refresh rulebooks list
      const data = await fetchRulebooks();
      setRulebooks(data);

      // Reset form
      setFile(null);
      setSelectedGame(null);
      setQuery("");

      notifications.show({
        title: "Success",
        message: "Rulebook uploaded successfully",
        color: "green",
      });
    } catch (err) {
      let errorMessage = "Failed to upload rulebook";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    open();
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteRulebook(deleteId);

      // Remove from state
      setRulebooks(rulebooks.filter(rulebook => rulebook._id !== deleteId));

      notifications.show({
        title: "Success",
        message: "Rulebook deleted successfully",
        color: "green",
      });
    } catch (err) {
      let errorMessage = "Failed to delete rulebook";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      close();
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Helper function to get the correct file URL
  const getFileUrl = (fileUrl: string) => {
    // Check if the URL starts with http or https
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }

    // If it's a relative path, prepend with API_URL
    return `${API_URL}${fileUrl}`;
  };

  // Function to handle direct file download
  const handleDownload = (fileUrl: string) => {
    // Open in a new window
    window.open(getFileUrl(fileUrl), '_blank');
  };

  return (
    <Container size="xl" py="xl">
      <Title
        order={1}
        className="!mb-8 !text-2xl !font-bold"
        c={isDarkMode ? "gray.1" : "gray.8"}
      >
        {t("PageRulebookTitle", { defaultValue: "Rulebooks" })}
      </Title>

      {!isLoggedIn ? (
        <Alert icon={<IconAlertCircle size="1rem" />} title={t("PageAuthRequiredTitle", { defaultValue: "Authentication Required" })} color="red">
          {t("PageAuthRequired", { defaultValue: "Please log in to view and manage rulebooks." })}
        </Alert>
      ) : (
        <Grid gutter="md">
          {/* Upload Form */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper
              p="md"
              radius="md"
              style={{
                backgroundColor: isDarkMode ? "#1f2937" : "white",
                borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
              }}
              withBorder
            >
              <Title
                order={3}
                className="!mb-4 !text-lg !font-semibold"
                c={isDarkMode ? "gray.1" : "gray.8"}
              >
                {t("PageUploadRulebookTitle", { defaultValue: "Upload Rulebook" })}
              </Title>

              <Box pos="relative">
                <LoadingOverlay visible={uploadLoading} zIndex={1000} overlayProps={{ radius: "md", blur: 2 }} />

                <Autocomplete
                  clearable
                  label={t("RuleBookSelectGameLabel", { defaultValue: "Select Game" })}
                  placeholder={t("RuleBookSelectGamePlaceholder", { defaultValue: "Type to search games" })}
                  value={query}
                  onChange={(value) => {
                    setQuery(value);
                  }}
                  onOptionSubmit={(item) => {
                    const itemName = item.split("_")[0];
                    const itemId = item.split("_")[1];
                    const selected = games.find((game) => game.name.toLowerCase() === itemName.toLowerCase() && game.bgg_id === itemId);
                    console.log("item:", item);
                    console.log("Selected game:", selected);
                    if (selected) {
                      setSelectedGame(selected);
                    }
                  }}
                  data={games.map((game: Game) => ({
                    value: `${game.name}_${game.bgg_id}`,
                    label: `${game.name}`,
                    id: game.bgg_id,
                  }))}
                  className="!mb-4"
                  styles={{
                    input: {
                      borderRadius: '0.5rem',
                      height: '2.5rem',
                      backgroundColor: isDarkMode ? "#374151" : "white",
                      borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                      color: isDarkMode ? "#f3f4f6" : "#1f2937",
                      "&:focus": {
                        borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                      },
                    },
                    label: {
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: '4px',
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

                <FileInput
                  label={t("RuleBookUploadLabel", { defaultValue: "Upload PDF Rulebook" })}
                  placeholder={t("RuleBookUploadPlaceholder", { defaultValue: "Select a PDF file" })}
                  accept="application/pdf"
                  value={file}
                  onChange={setFile}
                  leftSection={<IconFileUpload size={rem(16)} />}
                  className="!mb-4"
                  styles={{
                    input: {
                      borderRadius: '0.5rem',
                      height: '2.5rem',
                      backgroundColor: isDarkMode ? "#374151" : "white",
                      borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                      color: isDarkMode ? "#f3f4f6" : "#1f2937",
                      "&:focus": {
                        borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                      },
                    },
                    label: {
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: '4px',
                      color: isDarkMode ? "#d1d5db" : "#4b5563",
                    }
                  }}
                />

                <Button
                  onClick={handleUpload}
                  fullWidth
                  className={`!transition-colors !font-medium ${isDarkMode
                    ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
                    : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
                    }`}
                  radius="md"
                  disabled={!file || !selectedGame}
                  leftSection={<IconFileUpload size={16} />}
                >
                  {t("RuleBookUploadButton", { defaultValue: "Upload Rulebook" })}
                </Button>
              </Box>
            </Paper>
          </Grid.Col>

          {/* Rulebooks List */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Title
              order={2}
              className="!mb-4 !text-xl !font-semibold"
              c={isDarkMode ? "gray.1" : "gray.8"}
            >
              {t("RuleBookRepositoryTitle", { defaultValue: "Rulebook Repository" })}
            </Title>

            {loading ? (
              <Paper
                p="md"
                className="!relative !min-h-[100px]"
                style={{
                  backgroundColor: isDarkMode ? "#1f2937" : "white",
                  borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                }}
                withBorder
              >
                <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />
              </Paper>
            ) : error ? (
              <Alert title="Error" color="red">
                {error}
              </Alert>
            ) : rulebooks.length === 0 ? (
              <Paper
                p="xl"
                radius="md"
                className="!text-center"
                style={{
                  backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                  borderColor: isDarkMode ? "#6b7280" : "#e5e7eb",
                }}
                withBorder
              >
                <Text c={isDarkMode ? "gray.4" : "gray.6"}>{t("RuleBookNoAvailable", { defaultValue: "No rulebooks available. Upload a rulebook to get started." })}</Text>
              </Paper>
            ) : (
              <Stack gap="md">
                {rulebooks.map((rulebook) => (
                  <Card
                    key={rulebook._id}
                    withBorder
                    shadow="sm"
                    radius="md"
                    padding="md"
                    style={{
                      backgroundColor: isDarkMode ? "#1f2937" : "white",
                      borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap" mb={8}>
                      <Text
                        fw={600}
                        className="!line-clamp-1"
                        c={isDarkMode ? "gray.1" : "gray.8"}
                      >
                        {rulebook.game_name}
                      </Text>

                      <Group gap={8}>
                        <Tooltip label="View Rulebook">
                          <ActionIcon
                            variant="filled"
                            color="blue"
                            radius="md"
                            onClick={() => handleDownload(rulebook.file_url)}
                            style={{
                              backgroundColor: isDarkMode ? "#1d4ed8" : "#2563eb",
                              "&:hover": {
                                backgroundColor: isDarkMode ? "#2563eb" : "#1d4ed8",
                              }
                            }}
                          >
                            <IconBook size={16} />
                          </ActionIcon>
                        </Tooltip>

                        {rulebook.uploaded_by === localStorage.getItem("username") && (
                          <Tooltip label="Delete Rulebook">
                            <ActionIcon
                              variant="filled"
                              color="red"
                              radius="md"
                              onClick={() => openDeleteModal(rulebook._id)}
                              style={{
                                backgroundColor: isDarkMode ? "#b91c1c" : "#dc2626",
                                "&:hover": {
                                  backgroundColor: isDarkMode ? "#dc2626" : "#b91c1c",
                                }
                              }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Group>

                    <Group gap={8} mb={8}>
                      <Badge
                        color={isDarkMode ? "dark" : "gray"}
                        radius="sm"
                        style={{
                          backgroundColor: isDarkMode ? "#4b5563" : "#f3f4f6",
                          color: isDarkMode ? "#e5e7eb" : "#4b5563",
                        }}
                      >
                        {rulebook.filename}
                      </Badge>
                      <Badge
                        color={isDarkMode ? "blue" : "blue"}
                        radius="sm"
                        style={{
                          backgroundColor: isDarkMode ? "#1e3a8a" : "#dbeafe",
                          color: isDarkMode ? "#93c5fd" : "#1d4ed8",
                        }}
                      >
                        Uploaded: {formatDate(rulebook.uploaded_at)}
                      </Badge>
                    </Group>

                    <Text
                      size="sm"
                      c={isDarkMode ? "gray.4" : "dimmed"}
                    >
                      {t("RuleBookUploadedBy", { defaultValue: "Uploaded by" })}: {rulebook.uploaded_by}
                    </Text>
                  </Card>
                ))}
              </Stack>
            )}
          </Grid.Col>
        </Grid>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={t("RuleBookDeleteConfirmationTitle", { defaultValue: "Confirm Deletion" })}
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Text size="sm" mb="lg">
          {t("RuleBookDeleteConfirmationMessage", { defaultValue: "Are you sure you want to delete this rulebook? This action cannot be undone." })}
        </Text>

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={close}
            leftSection={<IconX size={14} />}
            className={`!transition-colors !font-medium ${isDarkMode
              ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
              : "!bg-gray-100 !text-gray-600 hover:!bg-gray-200"
              }`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            leftSection={<IconTrash size={14} />}
            className={`!transition-colors !font-medium ${isDarkMode
              ? "!bg-red-700 !text-red-200 hover:!bg-red-600"
              : "!bg-red-50 !text-red-600 hover:!bg-red-100"
              }`}
          >
            {t("RuleBookDeleteButton", { defaultValue: "Delete" })}
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default RulebooksPage; 