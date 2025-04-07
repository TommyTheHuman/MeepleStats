import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  fetchRulebooks, 
  uploadRulebook, 
  deleteRulebook, 
  fetchSharedRulebooks,
  uploadSharedRulebook,
  shareRulebook,
  addToCollection,
  removeFromCollection,
  fetchPersonalCollection
} from "../api/rulebooksApi";
import { RulebookInterface, Game } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { 
  Container, Title, Paper, Group, Text, Button, FileInput, 
  Autocomplete, LoadingOverlay, Box, Badge, Stack, Card, ActionIcon, 
  Tooltip, Alert, rem, Modal, Grid, Anchor, Tabs, Switch, Checkbox
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { 
  IconAlertCircle, 
  IconFileUpload, 
  IconDownload, 
  IconTrash, 
  IconX, 
  IconUser, 
  IconUsers,
  IconShare,
  IconPlus,
  IconMessageCircle,
  IconBook,
  IconCheck
} from "@tabler/icons-react";
import { useContext } from "react";
import { AuthContext } from "../components/AuthContext";

const RulebooksPage = () => {
  const navigate = useNavigate();
  const [rulebooks, setRulebooks] = useState<RulebookInterface[]>([]);
  const [sharedRulebooks, setSharedRulebooks] = useState<RulebookInterface[]>([]);
  const [personalCollection, setPersonalCollection] = useState<RulebookInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharedLoading, setSharedLoading] = useState(true);
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharedError, setSharedError] = useState<string | null>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isShared, setIsShared] = useState(true); 
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeModalOpened, { open: openRemoveModal, close: closeRemoveModal }] = useDisclosure(false);
  const { authStatus } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<string | null>("repository");

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

  // Fetch personal rulebooks
  useEffect(() => {
    const loadRulebooks = async () => {
      setLoading(true);
      try {
        const data = await fetchRulebooks();
        console.log('Rulebooks loaded:', data);
        setRulebooks(data);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadRulebooks();
  }, []);

  // Fetch shared rulebooks
  useEffect(() => {
    const loadSharedRulebooks = async () => {
      setSharedLoading(true);
      try {
        const data = await fetchSharedRulebooks();
        console.log('Shared rulebooks loaded:', data);
        setSharedRulebooks(data);
        setSharedError(null);
      } catch (err) {
        if (err instanceof Error) {
          setSharedError(err.message);
        } else {
          setSharedError(String(err));
        }
      } finally {
        setSharedLoading(false);
      }
    };
    
    loadSharedRulebooks();
  }, []);

  // Fetch personal collection
  useEffect(() => {
    const loadPersonalCollection = async () => {
      if (!isLoggedIn) return;
      
      setCollectionLoading(true);
      try {
        const data = await fetchPersonalCollection();
        console.log('Personal collection loaded:', data);
        setPersonalCollection(data);
        setCollectionError(null);
      } catch (err) {
        if (err instanceof Error) {
          setCollectionError(err.message);
        } else {
          setCollectionError(String(err));
        }
      } finally {
        setCollectionLoading(false);
      }
    };
    
    loadPersonalCollection();
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
      // Always upload to shared repository with isShared = true
      const response = await uploadSharedRulebook(file, selectedGame.bgg_id, selectedGame.name);
      console.log('Upload response:', response);
      
      // Only refresh shared rulebooks, the uploaded rulebooks are not  
      // automatically added to personal collection
      const sharedData = await fetchSharedRulebooks();
      setSharedRulebooks(sharedData);
      
      // Reset form
      setFile(null);
      setSelectedGame(null);
      setQuery("");
      
      notifications.show({
        title: "Success",
        message: "Rulebook uploaded successfully to the shared repository. Click the + button to add it to your collection.",
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
      setSharedRulebooks(sharedRulebooks.filter(rulebook => rulebook._id !== deleteId));
      
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

  const openRemoveFromCollectionModal = (id: string) => {
    setRemoveId(id);
    openRemoveModal();
  };

  const handleRemoveFromCollection = async () => {
    if (!removeId) return;
    
    try {
      await removeFromCollection(removeId);
      
      // Remove from personal collection state
      setPersonalCollection(personalCollection.filter(rulebook => rulebook._id !== removeId));
      
      notifications.show({
        title: "Success",
        message: "Rulebook removed from your collection",
        color: "green",
      });
    } catch (err) {
      let errorMessage = "Failed to remove rulebook from collection";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      closeRemoveModal();
      setRemoveId(null);
    }
  };

  const handleAddToCollection = async (id: string) => {
    try {
      const response = await addToCollection(id);
      
      // Refresh personal collection
      const collectionData = await fetchPersonalCollection();
      setPersonalCollection(collectionData);
      
      notifications.show({
        title: "Success",
        message: "Rulebook added to your collection",
        color: "green",
      });
    } catch (err) {
      let errorMessage = "Failed to add rulebook to your collection";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Check if the error is because the rulebook is already in the collection
      if (errorMessage.includes("already in your collection")) {
        notifications.show({
          title: "Already in Collection",
          message: "This rulebook is already in your collection",
          color: "blue",
        });
      } else {
        notifications.show({
          title: "Error",
          message: errorMessage,
          color: "red",
        });
      }
    }
  };

  const handleGoToChat = (rulebookId?: string) => {
    if (rulebookId) {
      navigate(`/rulebook-chat/${rulebookId}`);
    } else {
      navigate('/rulebook-chat');
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
  const handleDownload = (fileUrl: string, fileName: string) => {
    // Open in a new window
    window.open(getFileUrl(fileUrl), '_blank');
  };

  // Check if a rulebook is in the user's personal collection
  const isInPersonalCollection = (rulebookId: string) => {
    // Check by original rulebook ID or by the rulebook's file URL
    const rulebook = sharedRulebooks.find(r => r._id === rulebookId);
    if (!rulebook) return false;
    
    return personalCollection.some(
      pr => pr.original_rulebook_id === rulebookId || pr.file_url === rulebook.file_url
    );
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
        <Tabs defaultValue="repository" value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="repository" leftSection={<IconUsers size={14} />}>
              Rulebook Repository
            </Tabs.Tab>
            <Tabs.Tab value="collection" leftSection={<IconUser size={14} />}>
              My Collection
            </Tabs.Tab>
          </Tabs.List>

          <Grid gutter="md">
            {/* Upload Form - Show only in repository tab */}
            {activeTab === "repository" && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper p="md" radius="md" className="!bg-white">
                  <Title order={3} className="!mb-4 !text-gray-800 !text-lg !font-semibold">
                    Upload to Repository
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
                        if (selected) {
                          setSelectedGame(selected);
                        }
                      }}
                      data={games.map((game: Game) => ({
                        value: `${game.name}_${game.bgg_id}`,
                        label: `${game.name} (${game.yearPublished})`,
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
                    
                    <Text size="sm" c="dimmed" className="!mb-4">
                      All uploaded rulebooks are automatically shared in the repository.
                    </Text>
                    
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
            )}

            {/* Chat Button - Show only in collection tab */}
            {activeTab === "collection" && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper p="md" radius="md" className="!bg-white">
                  <Title order={3} className="!mb-4 !text-gray-800 !text-lg !font-semibold">
                    Rulebook Chat
                  </Title>

                  <Text size="sm" className="!mb-4">
                    Use the Rulebook Chat feature to ask questions about rulebooks in your collection.
                  </Text>

                  <Button
                    onClick={() => handleGoToChat()}
                    fullWidth
                    className="!bg-green-600 hover:!bg-green-700 !transition-colors"
                    radius="md"
                    leftSection={<IconMessageCircle size={16} />}
                    disabled={personalCollection.length === 0}
                  >
                    Go to Rulebook Chat
                  </Button>
                </Paper>
              </Grid.Col>
            )}

            {/* Rulebooks List - Conditional by Tab */}
            <Grid.Col span={{ base: 12, md: activeTab === "repository" ? 8 : 12 }}>
              {activeTab === "repository" ? (
                <>
                  <Title order={2} className="!mb-4 !text-gray-800 !text-xl !font-semibold">
                    Rulebook Repository
                  </Title>

                  {sharedLoading ? (
                    <Paper p="md" className="!bg-white !relative !min-h-[100px]">
                      <LoadingOverlay visible={sharedLoading} overlayProps={{ radius: "sm", blur: 2 }} />
                    </Paper>
                  ) : sharedError ? (
                    <Alert title="Error" color="red">
                      {sharedError}
                    </Alert>
                  ) : sharedRulebooks.length === 0 ? (
                    <Paper p="xl" radius="md" className="!bg-gray-50 !border !border-gray-200 !text-center">
                      <Text className="!text-gray-600">No rulebooks available in the repository. Upload a rulebook to get started.</Text>
                    </Paper>
                  ) : (
                    <Stack gap="md">
                      {sharedRulebooks.map((rulebook) => (
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
                                  onClick={() => handleDownload(rulebook.file_url, rulebook.filename)}
                                >
                                  <IconBook size={16} />
                                </ActionIcon>
                              </Tooltip>

                              {isInPersonalCollection(rulebook._id) ? (
                                <Tooltip label="Already in Your Collection">
                                  <ActionIcon 
                                    variant="filled" 
                                    color="green" 
                                    radius="md"
                                    disabled
                                  >
                                    <IconCheck size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              ) : (
                                <Tooltip label="Add to Your Collection">
                                  <ActionIcon 
                                    variant="filled" 
                                    color="green" 
                                    radius="md"
                                    onClick={() => handleAddToCollection(rulebook._id)}
                                  >
                                    <IconPlus size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                              
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
                          
                          <Group gap="xs" mb={8}>
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
                </>
              ) : (
                <>
                  <Title order={2} className="!mb-4 !text-gray-800 !text-xl !font-semibold">
                    My Collection
                  </Title>

                  {collectionLoading ? (
                    <Paper p="md" className="!bg-white !relative !min-h-[100px]">
                      <LoadingOverlay visible={collectionLoading} overlayProps={{ radius: "sm", blur: 2 }} />
                    </Paper>
                  ) : collectionError ? (
                    <Alert title="Error" color="red">
                      {collectionError}
                    </Alert>
                  ) : personalCollection.length === 0 ? (
                    <Paper p="xl" radius="md" className="!bg-gray-50 !border !border-gray-200 !text-center">
                      <Text className="!text-gray-600 !mb-4">Your collection is empty. Add rulebooks from the repository to get started.</Text>
                      <Button
                        onClick={() => setActiveTab("repository")}
                        className="!bg-blue-600 hover:!bg-blue-700 !transition-colors"
                        radius="md"
                      >
                        Browse Repository
                      </Button>
                    </Paper>
                  ) : (
                    <Grid>
                      {personalCollection.map((rulebook) => (
                        <Grid.Col key={rulebook._id} span={{ base: 12, md: 6, lg: 4 }}>
                          <Card withBorder shadow="sm" radius="md" padding="md" className="!bg-white h-100">
                            <Group justify="space-between" wrap="nowrap" mb={8}>
                              <Text fw={600} className="!text-gray-800 !line-clamp-1">
                                {rulebook.game_name}
                              </Text>
                            </Group>
                            
                            <Text lineClamp={1} size="sm" c="dimmed" className="!mb-4">
                              {rulebook.filename}
                            </Text>
                            
                            <Group gap="xs" mb={12}>
                              <Badge color="blue" radius="sm">Added: {formatDate(rulebook.uploaded_at)}</Badge>
                              {rulebook.added_from_shared && (
                                <Badge color="gray" radius="sm">From Repository</Badge>
                              )}
                            </Group>

                            <Group justify="apart" mt="auto">
                              <Button
                                variant="light"
                                color="blue"
                                radius="md"
                                leftSection={<IconBook size={16} />}
                                onClick={() => handleDownload(rulebook.file_url, rulebook.filename)}
                              >
                                View
                              </Button>
                              
                              <Button
                                variant="light"
                                color="green"
                                radius="md"
                                leftSection={<IconMessageCircle size={16} />}
                                onClick={() => handleGoToChat(rulebook._id)}
                              >
                                Chat
                              </Button>
                              
                              <ActionIcon
                                variant="filled"
                                color="red"
                                radius="md"
                                onClick={() => openRemoveFromCollectionModal(rulebook._id)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Card>
                        </Grid.Col>
                      ))}
                    </Grid>
                  )}
                </>
              )}
            </Grid.Col>
          </Grid>
        </Tabs>
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
          Are you sure you want to delete this rulebook from the repository? This action cannot be undone.
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
      
      {/* Remove from Collection Modal */}
      <Modal
        opened={removeModalOpened} 
        onClose={closeRemoveModal} 
        title="Remove from Collection" 
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Text size="sm" mb="lg">
          Are you sure you want to remove this rulebook from your collection? This will not delete the rulebook from the repository.
        </Text>
        
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeRemoveModal} leftSection={<IconX size={14} />}>
            Cancel
          </Button>
          <Button color="red" onClick={handleRemoveFromCollection} leftSection={<IconTrash size={14} />}>
            Remove
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default RulebooksPage; 