import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { fetchRulebookById, fetchSharedRulebooks, sendChatQuery } from "../api/rulebooksApi";
import { RulebookInterface } from "../model/Interfaces";
import { API_URL } from "../model/Constants";
import { Container, Title, Paper, Group, Text, Button, Select, LoadingOverlay, Box, Textarea, Stack, Avatar, Alert, Badge, ScrollArea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconSend, IconRobot, IconUser, IconBook, IconFile } from "@tabler/icons-react";
import { useContext } from "react";
import { AuthContext } from "../components/AuthContext";
//import ReactMarkdown from 'react-markdown';
//import remarkGfm from 'remark-gfm';


interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
  page_refs?: Array<{ page: string; file: string }>;
}

const RulebookChatPage = () => {
  const { rulebook_id } = useParams();
  const navigate = useNavigate();
  const [rulebooks, setRulebooks] = useState<RulebookInterface[]>([]);
  const [selectedRulebook, setSelectedRulebook] = useState<RulebookInterface | null>(null);
  const [selectedRulebookId, setSelectedRulebookId] = useState<string | null>(rulebook_id || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const { authStatus } = useContext(AuthContext);

  const isLoggedIn = authStatus === "LoggedIn";

  // Fetch personal collection
  useEffect(() => {
    const loadPersonalCollection = async () => {
      setLoading(true);
      try {
        const data = await fetchSharedRulebooks();
        console.log('Personal collection loaded:', data);
        setRulebooks(data);
        setError(null);

        // If we have a rulebook_id in the URL, load that rulebook
        if (rulebook_id) {
          try {
            const rulebook = await fetchRulebookById(rulebook_id);
            setSelectedRulebook(rulebook);
          } catch (err) {
            console.error("Error loading specific rulebook:", err);

            // If the rulebook doesn't exist or isn't in the user's collection,
            // select the first rulebook in the collection if available
            if (data.length > 0) {
              setSelectedRulebook(data[0]);
              setSelectedRulebookId(data[0]._id);
              navigate(`/rulebook-chat/${data[0]._id}`, { replace: true });
            }
          }
        } else if (data.length > 0) {
          // If no rulebook_id in URL, select the first one
          setSelectedRulebook(data[0]);
          setSelectedRulebookId(data[0]._id);
          navigate(`/rulebook-chat/${data[0]._id}`, { replace: true });
        }
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

    if (isLoggedIn) {
      loadPersonalCollection();
    }
  }, [isLoggedIn, rulebook_id, navigate]);

  // Effect to handle rulebook selection change
  useEffect(() => {
    const loadSelectedRulebook = async () => {
      if (!selectedRulebookId) return;

      try {
        // First check if the rulebook is already in our loaded collection
        const found = rulebooks.find(r => r._id === selectedRulebookId);

        if (found) {
          setSelectedRulebook(found);
          return;
        }

        // If not found locally, fetch it from the API
        const rulebook = await fetchRulebookById(selectedRulebookId);
        setSelectedRulebook(rulebook);
        navigate(`/rulebook-chat/${selectedRulebookId}`, { replace: true });
      } catch (err) {
        console.error("Error loading selected rulebook:", err);
        notifications.show({
          title: "Error",
          message: "Failed to load the selected rulebook",
          color: "red",
        });
      }
    };

    if (selectedRulebookId) {
      loadSelectedRulebook();
    }
  }, [selectedRulebookId, rulebooks, navigate]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedRulebookId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      sender: "user",
      timestamp: new Date()
    };

    // Add placeholder for bot response
    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      content: "",
      sender: "bot",
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    setMessage("");
    setChatLoading(true);

    try {
      // Send query to backend - always false for includeContext
      const response = await sendChatQuery(message.trim(), selectedRulebookId, false);

      // Update bot message with response
      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? {
            ...msg,
            content: response.answer,
            isLoading: false,
            page_refs: response.page_refs
          }
          : msg
      ));
    } catch (err) {
      // Update bot message with error
      let errorMessage = "Failed to get an answer. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? {
            ...msg,
            content: errorMessage,
            isLoading: false,
            error: errorMessage
          }
          : msg
      ));

      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper function to get the correct file URL
  const getFileUrl = (fileUrl: string | undefined) => {
    if (!fileUrl) return "";

    // Check if the URL starts with http or https
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }

    // If it's a relative path, prepend with API_URL
    return `${API_URL}${fileUrl}`;
  };

  // Function to handle rulebook viewing
  const handleViewRulebook = () => {
    if (selectedRulebook?.file_url) {
      window.open(getFileUrl(selectedRulebook.file_url), '_blank');
    }
  };

  return (
    <Container size="xl" py="xl">
      <Title order={1} className="!mb-8 !text-gray-800 !text-2xl !font-bold">
        Rulebook Chat
      </Title>

      {!isLoggedIn ? (
        <Alert icon={<IconAlertCircle size="1rem" />} title="Authentication Required" color="red">
          Please log in to use the Rulebook Chat feature.
        </Alert>
      ) : (
        <Paper p="md" radius="md" className="!bg-white">
          <LoadingOverlay visible={loading} overlayProps={{ radius: "md", blur: 2 }} />

          {error ? (
            <Alert title="Error" color="red">
              {error}
            </Alert>
          ) : rulebooks.length === 0 ? (
            <Alert title="No Rulebooks Found" color="yellow">
              You don't have any rulebooks in your personal collection. Add rulebooks to your collection to use the chat feature.
            </Alert>
          ) : (
            <Box>
              <Group mb="md" align="flex-start" justify="space-between">
                <Box style={{ flex: '1' }}>
                  <Select
                    label="Select Rulebook"
                    placeholder="Choose a rulebook from your collection"
                    data={rulebooks.map(rulebook => ({
                      value: rulebook._id,
                      label: `${rulebook.game_name} - ${rulebook.filename}`
                    }))}
                    value={selectedRulebookId}
                    onChange={(value) => setSelectedRulebookId(value)}
                    searchable
                    clearable={false}
                    className="!mb-2"
                    styles={{
                      input: { borderRadius: '0.5rem', height: '2.5rem' },
                      label: { fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }
                    }}
                  />
                </Box>

                <Button
                  onClick={handleViewRulebook}
                  className="!bg-blue-600 hover:!bg-blue-700 !transition-colors !mt-7"
                  radius="md"
                  leftSection={<IconBook size={16} />}
                  disabled={!selectedRulebook}
                >
                  View Rulebook
                </Button>
              </Group>

              {selectedRulebook && (
                <>
                  <Paper
                    p="md"
                    radius="md"
                    className="!bg-gray-50 !mb-4"
                    withBorder
                    style={{ height: '500px' }}
                  >
                    <ScrollArea h={480} scrollbarSize={6} offsetScrollbars>
                      {messages.length === 0 ? (
                        <Box className="flex items-center justify-center h-full">
                          <Text className="text-gray-500 text-center">
                            Ask any question about "{selectedRulebook.game_name}" using the rulebook "{selectedRulebook.filename}".
                          </Text>
                        </Box>
                      ) : (
                        <Stack gap="md">
                          {messages.map((msg) => (
                            <Group
                              key={msg.id}
                              justify={msg.sender === "user" ? "right" : "left"}
                              wrap="nowrap"
                              gap="xs"
                            >
                              {msg.sender === "bot" && (
                                <Avatar color="blue" radius="xl">
                                  <IconRobot size={18} />
                                </Avatar>
                              )}

                              <Box className={`!max-w-[85%]`}>
                                <Paper
                                  p="sm"
                                  radius="md"
                                  className={`${msg.sender === "user"
                                    ? "!bg-blue-500 !text-white"
                                    : "!bg-white !text-gray-800 !border !border-gray-200"
                                    } ${msg.error ? "!border-red-300" : ""}`}
                                >
                                  {msg.isLoading ? (
                                    <Text size="sm">Thinking...</Text>
                                  ) : (
                                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                                  )}
                                </Paper>

                                {msg.page_refs && msg.page_refs.length > 0 && (
                                  <Group mt="xs" gap="xs">
                                    <Text size="xs" fw={500} c="dimmed">References:</Text>
                                    {msg.page_refs.map((ref, index) => (
                                      <Badge
                                        key={index}
                                        size="sm"
                                        color="blue"
                                        variant="light"
                                        leftSection={<IconFile size={12} />}
                                      >
                                        {ref.file.split('.')[0]} - Page {ref.page}
                                      </Badge>
                                    ))}
                                  </Group>
                                )}
                              </Box>

                              {msg.sender === "user" && (
                                <Avatar color="blue" radius="xl">
                                  <IconUser size={18} />
                                </Avatar>
                              )}
                            </Group>
                          ))}
                        </Stack>
                      )}
                    </ScrollArea>
                  </Paper>

                  <Group align="flex-start" gap="xs">
                    <Textarea
                      placeholder="Ask a question about the rulebook..."
                      value={message}
                      onChange={(e) => setMessage(e.currentTarget.value)}
                      onKeyDown={handleKeyDown}
                      autosize
                      minRows={2}
                      maxRows={4}
                      className="!flex-grow"
                      disabled={chatLoading}
                      styles={{
                        input: { borderRadius: '0.5rem' }
                      }}
                    />

                    <Button
                      onClick={handleSendMessage}
                      className="!bg-blue-600 hover:!bg-blue-700 !transition-colors"
                      radius="md"
                      disabled={!message.trim() || chatLoading}
                      loading={chatLoading}
                    >
                      <IconSend size={16} />
                    </Button>
                  </Group>
                </>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default RulebookChatPage; 