import { useEffect, useState } from "react";
import { fetchRulebooks, deleteRulebook, uploadRulebook } from "../api/rulebooksApi";
import { RulebookInterface, Game } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { Container, Title, Paper, Group, Text, Button, FileInput, Autocomplete, LoadingOverlay, Box, Badge, Stack, Card, ActionIcon, Tooltip, Alert, rem, Modal, Grid } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconFileUpload, IconTrash, IconX, IconBook } from "@tabler/icons-react";
import { useContext } from "react";
import { AuthContext } from "../components/AuthContext";

const RulebooksPage = () => {
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
      <Title order={1} className="!mb-8 !text-gray-800 !text-2xl !font-bold">
        Rulebooks
      </Title>

      {!isLoggedIn ? (
        <Alert icon={<IconAlertCircle size="1rem" />} title="Authentication Required" color="red">
          Please log in to view and manage rulebooks.
        </Alert>
      ) : (
        <Grid gutter="md">
          {/* Upload Form */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="md" radius="md" className="!bg-white">
              <Title order={3} className="!mb-4 !text-gray-800 !text-lg !font-semibold">
                Upload Rulebook
              </Title>

              <Box pos="relative">
                <LoadingOverlay visible={uploadLoading} zIndex={1000} overlayProps={{ radius: "md", blur: 2 }} />

                <Autocomplete
                  clearable
                  label="Select Game"
                  placeholder="Type to search games"
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
                    input: { borderRadius: '0.5rem', height: '2.5rem' },
                    label: { fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }
                  }}
                />

                <FileInput
                  label="Upload PDF Rulebook"
                  placeholder="Select a PDF file"
                  accept="application/pdf"
                  value={file}
                  onChange={setFile}
                  leftSection={<IconFileUpload size={rem(16)} />}
                  className="!mb-4"
                  styles={{
                    input: { borderRadius: '0.5rem', height: '2.5rem' },
                    label: { fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }
                  }}
                />

                <Button
                  onClick={handleUpload}
                  fullWidth
                  className="!bg-blue-600 hover:!bg-blue-700 !transition-colors"
                  radius="md"
                  disabled={!file || !selectedGame}
                  leftSection={<IconFileUpload size={16} />}
                >
                  Upload Rulebook
                </Button>
              </Box>
            </Paper>
          </Grid.Col>

          {/* Rulebooks List */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Title order={2} className="!mb-4 !text-gray-800 !text-xl !font-semibold">
              Rulebook Repository
            </Title>

            {loading ? (
              <Paper p="md" className="!bg-white !relative !min-h-[100px]">
                <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />
              </Paper>
            ) : error ? (
              <Alert title="Error" color="red">
                {error}
              </Alert>
            ) : rulebooks.length === 0 ? (
              <Paper p="xl" radius="md" className="!bg-gray-50 !border !border-gray-200 !text-center">
                <Text className="!text-gray-600">No rulebooks available. Upload a rulebook to get started.</Text>
              </Paper>
            ) : (
              <Stack gap="md">
                {rulebooks.map((rulebook) => (
                  <Card key={rulebook._id} withBorder shadow="sm" radius="md" padding="md" className="!bg-white">
                    <Group justify="space-between" wrap="nowrap" mb={8}>
                      <Text fw={600} className="!text-gray-800 !line-clamp-1">
                        {rulebook.game_name}
                      </Text>

                      <Group gap={8}>
                        <Tooltip label="View Rulebook">
                          <ActionIcon
                            variant="filled"
                            color="blue"
                            radius="md"
                            onClick={() => handleDownload(rulebook.file_url)}
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
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Group>

                    <Group gap={8} mb={8}>
                      <Badge color="gray" radius="sm">{rulebook.filename}</Badge>
                      <Badge color="blue" radius="sm">Uploaded: {formatDate(rulebook.uploaded_at)}</Badge>
                    </Group>

                    <Text size="sm" c="dimmed">
                      Uploaded by: {rulebook.uploaded_by}
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
        title="Confirm Deletion"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Text size="sm" mb="lg">
          Are you sure you want to delete this rulebook? This action cannot be undone.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={close} leftSection={<IconX size={14} />}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} leftSection={<IconTrash size={14} />}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default RulebooksPage; 