import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { fetchRulebookById, fetchRulebooks, sendChatQuery } from "../api/rulebooksApi";
import { RulebookInterface } from "../model/Interfaces";
import { API_URL } from "../model/Constants";
import { Container, Title, Paper, Group, Text, Button, Select, LoadingOverlay, Box, Textarea, Stack, Avatar, Alert, Badge, ScrollArea, useMantineColorScheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconSend, IconRobot, IconUser, IconBook, IconFile } from "@tabler/icons-react";
import { useContext } from "react";
import { AuthContext } from "../components/AuthContext";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from "react-i18next";

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
  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";
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
  const { t } = useTranslation();

  const isLoggedIn = authStatus === "LoggedIn";

  // Fetch rulebooks
  useEffect(() => {
    const loadRulebooks = async () => {
      setLoading(true);
      try {
        const data = await fetchRulebooks();
        console.log('Rulebooks loaded:', data);
        setRulebooks(data);
        setError(null);

        // If we have a rulebook_id in the URL, load that rulebook
        if (rulebook_id) {
          try {
            const rulebook = await fetchRulebookById(rulebook_id);
            setSelectedRulebook(rulebook);
          } catch (err) {
            console.error("Error loading specific rulebook:", err);

            // If the rulebook doesn't exist, select the first rulebook in the collection if available
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
      loadRulebooks();
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
      <Title
        order={1}
        className="!mb-8 !text-2xl !font-bold"
        c={isDarkMode ? "gray.1" : "gray.8"}
      >
        {t("RulebookChatTitle", { defaultValue: "Rulebook Chat" })}
      </Title>

      {!isLoggedIn ? (
        <Alert icon={<IconAlertCircle size="1rem" />} title={t("RulebookChatAuthRequiredTitle", { defaultValue: "Authentication Required" })} color="red">
          {t("RulebookChatAuthRequired", { defaultValue: "Please log in to use the Rulebook Chat feature." })}
        </Alert>
      ) : (
        <Paper
          p="md"
          radius="md"
          style={{
            backgroundColor: isDarkMode ? "#1f2937" : "white",
            borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
          }}
          withBorder
        >
          <LoadingOverlay visible={loading} overlayProps={{ radius: "md", blur: 2 }} />

          {error ? (
            <Alert title="Error" color="red">
              {error}
            </Alert>
          ) : rulebooks.length === 0 ? (
            <Alert title={t("RulebookChatNoRulebooksFound", { defaultValue: "No Rulebooks Found" })} color="yellow">
              {t("RulebookChatNoRulebooksAvailable", { defaultValue: "There are no rulebooks available. Upload rulebooks to use the chat feature." })}
            </Alert>
          ) : (
            <Box>
              <Group mb="md" align="flex-start" justify="space-between">
                <Box style={{ flex: '1' }}>
                  <Select
                    label={t("RulebookChatSelectRulebook", { defaultValue: "Select Rulebook" })}
                    placeholder={t("RulebookChatSelectRulebookPlaceholder", { defaultValue: "Choose a rulebook" })}
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
                </Box>

                <Button
                  onClick={handleViewRulebook}
                  className={`!transition-colors !font-medium !mt-7 ${isDarkMode
                    ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
                    : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
                    }`}
                  radius="md"
                  leftSection={<IconBook size={16} />}
                  disabled={!selectedRulebook}
                >
                  {t("RulebookChatViewRulebook", { defaultValue: "View Rulebook" })}
                </Button>
              </Group>

              {selectedRulebook && (
                <>
                  <Paper
                    p="md"
                    radius="md"
                    className="!mb-4"
                    withBorder
                    style={{
                      height: '500px',
                      backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                      borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                    }}
                  >
                    <ScrollArea h={480} scrollbarSize={6} offsetScrollbars>
                      {messages.length === 0 ? (
                        <Box className="flex items-center justify-center h-full">
                          <Text
                            className="text-center"
                            c={isDarkMode ? "gray.4" : "gray.6"}
                          >
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
                                    <Text size="sm">{t("RulebookChatThinking", { defaultValue: "Thinking..." })}</Text>
                                  ) : (
                                    msg.sender === "bot" ? (
                                      <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}

                                      >
                                        {msg.content}
                                      </ReactMarkdown>
                                    ) : (
                                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                                    )
                                  )}
                                </Paper>

                                {msg.page_refs && msg.page_refs.length > 0 && (
                                  <Group mt="xs" gap="xs">
                                    <Text size="xs" fw={500} c="dimmed">{t("RulebookChatReferences", { defaultValue: "References" })}:</Text>
                                    {msg.page_refs.map((ref, index) => (
                                      <Badge
                                        key={index}
                                        size="sm"
                                        color="blue"
                                        variant="light"
                                        leftSection={<IconFile size={12} />}
                                      >
                                        {ref.file.split('.')[0]} - {t("RulebookChatPage", { defaultValue: "Page" })} {ref.page}
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
                      placeholder={t("RulebookChatAskQuestionPlaceholder", { defaultValue: "Ask a question about the rulebook..." })}
                      value={message}
                      onChange={(e) => setMessage(e.currentTarget.value)}
                      onKeyDown={handleKeyDown}
                      autosize
                      minRows={2}
                      maxRows={4}
                      className="!flex-grow"
                      disabled={chatLoading}
                      styles={{
                        input: {
                          borderRadius: '0.5rem',
                          backgroundColor: isDarkMode ? "#374151" : "white",
                          borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                          color: isDarkMode ? "#f3f4f6" : "#1f2937",
                          "&:focus": {
                            borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                          },
                        }
                      }}
                    />

                    <Button
                      onClick={handleSendMessage}
                      className={`!transition-colors !font-medium ${isDarkMode
                        ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
                        : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
                        }`}
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