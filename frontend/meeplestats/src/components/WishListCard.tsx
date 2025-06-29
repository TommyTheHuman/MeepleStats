import { Card, Text, Image, Title, Badge, Group, ActionIcon, Tooltip, useMantineColorScheme } from "@mantine/core";
import { WishListCardInterface } from "../model/Interfaces";
//import { useState } from "react";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { IconX } from "@tabler/icons-react";


const WishListCard = ({ name, thumbnail, minPlayers, maxPlayers, notes, playingTime, username, gameId, onDelete }: WishListCardInterface) => {
  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";
  const handleDelete = async () => {
    //setLoading(true);
    const requestOptions: RequestInit = {
      method: "DELETE",
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
      game_id: gameId
    });

    const response = await fetch(`${API_URL}/removewishlist`, requestOptions);
    if (response.ok) {
      if (onDelete) {
        onDelete();
      }
    }
    //setLoading(false);
  }

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      className="!border !overflow-hidden !transition-shadow hover:!shadow-md !h-full !flex !flex-col"
      style={{
        backgroundColor: isDarkMode ? "#1f2937" : "white",
        borderColor: isDarkMode ? "#6b7280" : "#e5e7eb",
      }}
    >

      {/* Image Section */}
      <Card.Section>
        <div className="!relative !overflow-hidden !h-[160px]">
          {/* Delete Button */}
          <Tooltip label="Remove from wishlist">
            <ActionIcon
              color="red"
              variant="subtle"
              onClick={handleDelete}
              className="!absolute !top-2 !right-2 !z-10 !shadow-sm !transition-colors"
              style={{
                backgroundColor: isDarkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.8)",
                "&:hover": {
                  backgroundColor: isDarkMode ? "#7f1d1d" : "#fef2f2",
                }
              }}
              radius="xl"
              size="md"
              aria-label="Remove from wishlist"
            >
              <IconX size={16} stroke={2} />
            </ActionIcon>
          </Tooltip>
          <Image
            src={thumbnail}
            alt={name}
            fit="cover"
            className="!w-full !h-full !object-cover !transition-transform hover:!scale-105"
            loading="lazy"
          />
        </div>
      </Card.Section>

      {/* Content Section */}
      <Card.Section className="!px-4 !py-3 !flex-1 !flex !flex-col">
        <Title
          order={4}
          lineClamp={1}
          className="!mt-1 !mb-2 !tracking-tight"
          c={isDarkMode ? "gray.1" : "gray.9"}
        >
          {name}
        </Title>

        <Group gap="sm" className="!mb-2">
          <Badge
            className="!font-normal !px-2"
            variant="light"
            style={{
              backgroundColor: isDarkMode ? "#1e40af" : "#dbeafe",
              color: isDarkMode ? "#93c5fd" : "#1d4ed8",
            }}
          >
            {minPlayers} - {maxPlayers} players
          </Badge>
          <Badge
            className="!font-normal !px-2"
            variant="light"
            style={{
              backgroundColor: isDarkMode ? "#d97706" : "#fef3c7",
              color: isDarkMode ? "#fbbf24" : "#d97706",
            }}
          >
            {playingTime} min
          </Badge>
          <Badge
            className="!font-normal !px-2"
            variant="light"
            style={{
              backgroundColor: isDarkMode ? "#059669" : "#d1fae5",
              color: isDarkMode ? "#34d399" : "#047857",
            }}
          >
            {username}
          </Badge>
        </Group>

        {notes && (
          <div className="!mt-auto">
            <Text
              size="sm"
              fw={500}
              className="!mb-1"
              c={isDarkMode ? "gray.1" : "gray.7"}
            >
              Notes
            </Text>
            <Text
              size="sm"
              lineClamp={3}
              className="!leading-snug !text-sm"
              style={{ wordBreak: 'break-word' }}
              c={isDarkMode ? "gray.3" : "gray.6"}
            >
              {notes}
            </Text>
          </div>
        )}
      </Card.Section>
    </Card>
  );
};

export default WishListCard;