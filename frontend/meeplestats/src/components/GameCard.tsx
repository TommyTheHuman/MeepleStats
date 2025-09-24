import { Card, Checkbox, Image, TextInput, Text, Button, Stack, Group, Badge, Tooltip, ActionIcon } from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";
import { Game } from "../model/Interfaces";
import { useState } from "react";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { notifications } from "@mantine/notifications";
import { IconBook2 } from "@tabler/icons-react";
import { SiBoardgamegeek } from "react-icons/si";
import { GiCardJoker } from "react-icons/gi";
import { useTranslation } from "react-i18next";

const GameCard = ({ game }: { game: Game }) => {

  // Initialize state for price and isGift properties with the game object
  const [price, setPrice] = useState(game.price);
  const [isGifted, setIsGifted] = useState(game.isGifted);
  const [location, setLocation] = useState(game.location);
  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";

  const { t } = useTranslation();

  const openBGGLink = () => {
    const bggUrl = `https://boardgamegeek.com/boardgame/${game.bgg_id}`;
    window.open(bggUrl, "_blank");
  };

  const openBGGSleeves = () => {
    let name = game.name;
    name = name?.replace(/\s+/g, "-").toLowerCase();
    const bggSleevesUrl = `https://boardgamegeek.com/boardgame/${game.bgg_id}/${name}/sleeves`;
    window.open(bggSleevesUrl, "_blank");
  };

  // Function to update the game object
  const updateGame = async () => {

    const requestOptions: RequestInit = {
      method: "POST",
    };

    // Check the JWT_STORAGE value and set credentials or headers accordingly
    if (JWT_STORAGE === "cookie") {
      requestOptions.credentials = "include";
      requestOptions.headers = {
        "Content-Type": "application/json",
      };
    } else if (JWT_STORAGE === "localstorage") {
      requestOptions.headers = {
        Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        "Content-Type": "application/json"
      };
    }

    requestOptions.body = JSON.stringify({
      game_id: game.bgg_id,
      price: price,
      isGifted: isGifted,
      location: location
    });

    console.log(requestOptions.body);

    const response = await fetch(`${API_URL}/updateGames`, requestOptions);
    if (response.ok) {
      // Notify the user that the game has been updated
      notifications.show({
        color: "Green",
        title: "Success",
        message: "Game updated successfully",
      });
    } else {
      // Notify the user that the game has not been updated
      notifications.show({
        color: "Red",
        title: "Error",
        message: "Game not updated",
      });
    }

  };

  return (
    <Card
      shadow="xs"
      padding="md"
      radius="lg"
      style={{ cursor: "pointer" }}
      className={`!overflow-hidden !transition-shadow hover:!shadow-md !w-full ${isDarkMode ? "!bg-gray-800 !border-gray-700" : "!bg-white !border-gray-100"
        }`}
    >
      {/* Image Section */}
      <Card.Section>
        <div className="!relative !overflow-hidden !h-[160px]">
          <Image
            src={game.thumbnail}
            alt={game.name}
            fit="cover"
            className="!w-full !h-full !object-cover !transition-transform hover:!scale-105"
            loading="lazy"
          />

          {/* Rulebook indicator */}
          {game.hasRules && (
            <Tooltip label={t("Rulebook available", { defaultValue: "Rulebook available" })}>
              <Badge
                className={`!absolute !top-2 !right-2 !z-10 ${isDarkMode ? "!bg-yellow-500 !text-gray-900" : "!bg-blue-500 !text-white"
                  }`}
                radius="sm"
                leftSection={<IconBook2 size={14} />}
              >
                {t('Rulebook', { defaultValue: 'Rulebook' })}
              </Badge>
            </Tooltip>
          )}
        </div>
      </Card.Section>

      {/* Game Title */}
      <Text
        size="md"
        fw={500}
        className={`!mt-3 !mb-2 !tracking-tight !truncate ${isDarkMode ? "!text-gray-100" : "!text-gray-900"
          }`}
      >
        {game.name}
      </Text>

      {/* Controls */}
      <Stack gap="xs" className="!mt-2">
        {/* Gift Checkbox */}
        <Checkbox
          label={t("GameGifted", { defaultValue: "Gift" })}
          checked={isGifted}
          onChange={(event) => setIsGifted(event.currentTarget.checked)}
          className="!text-sm"
          styles={{
            label: {
              fontSize: "0.875rem",
              color: isDarkMode ? "#ddd" : "#666",
              paddingLeft: "4px",
            },
            input: {
              cursor: "pointer",
            },
          }}
        />

        {/* Price Input */}
        <TextInput
          label={t("GamePrice", { defaultValue: "Price" })}
          placeholder="0.00"
          value={price}
          onChange={(event) => setPrice(event.currentTarget.value)}
          styles={{
            input: {
              borderRadius: "0.5rem",
              border: `1px solid ${isDarkMode ? "#444" : "#e5e7eb"}`,
              backgroundColor: isDarkMode ? "#333" : "#f9fafb",
              color: isDarkMode ? "#ddd" : "#000",
              height: "36px",
              fontSize: "0.875rem",
              padding: "0 12px",
            },
            label: {
              fontSize: "0.875rem",
              fontWeight: 500,
              color: isDarkMode ? "#ddd" : "#666",
              marginBottom: "4px",
            },
          }}
          className="!mb-2"
          type="number"
          step="0.01"
          inputMode="decimal"
        />
        <TextInput
          label={t("GameLocation", { defaultValue: "Location" })}
          placeholder={t("GameLocationPlaceholder", { defaultValue: "e.g. Shelf A3" })}
          value={location}
          onChange={(event) => setLocation(event.currentTarget.value)}
          styles={{
            input: {
              borderRadius: "0.5rem",
              border: `1px solid ${isDarkMode ? "#444" : "#e5e7eb"}`,
              backgroundColor: isDarkMode ? "#333" : "#f9fafb",
              color: isDarkMode ? "#ddd" : "#000",
              height: "36px",
              fontSize: "0.875rem",
              padding: "0 12px",
            },
            label: {
              fontSize: "0.875rem",
              fontWeight: 500,
              color: isDarkMode ? "#ddd" : "#666",
              marginBottom: "4px",
            },
          }}
          className="!mb-2"

        />
      </Stack>

      {/* Update Button */}
      <Group justify="flex-end" mt="xs">
        <Tooltip label={t("GameSleevesCheck", { defaultValue: "Check the Sleeves" })} withArrow>
          <ActionIcon
            variant="light"
            color="blue"
            size="lg"
            onClick={openBGGSleeves}
            style={{ marginLeft: 8 }}
            aria-label="Check the Sleeves"
          >
            <GiCardJoker size={22} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("GameBGGOpen", { defaultValue: "Open on BoardGameGeek" })} withArrow>
          <ActionIcon
            variant="light"
            color="blue"
            size="lg"
            onClick={openBGGLink}
            style={{ marginLeft: 8 }}
            aria-label="Open on BoardGameGeek"
          >
            <SiBoardgamegeek size={22} />
          </ActionIcon>
        </Tooltip>
        <Button
          variant="light"
          radius="md"
          onClick={updateGame}
          className={`!font-medium !transition-colors !text-sm !px-4 !py-1.5 active:!scale-95 ${isDarkMode
            ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
            : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
            }`}
          style={{ touchAction: "manipulation" }}
        >
          {t("GameUpdate", { defaultValue: "Update" })}
        </Button>
      </Group>
    </Card>
  );
};

export default GameCard;