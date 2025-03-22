import { Card, Checkbox, Image, TextInput, Text, Button, Stack, Group } from "@mantine/core";
import { Game } from "../model/Interfaces";
import { useState } from "react";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { notifications } from "@mantine/notifications";


const GameCard = ({ game }: { game: Game }) => {

  // Initialize state for price and isGift properties with the game object
  const [price, setPrice] = useState(game.price);
  const [isGifted, setIsGifted] = useState(game.isGifted);

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
      isGifted: isGifted
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
      className="!bg-white !border !border-gray-100 !overflow-hidden !transition-shadow hover:!shadow-md !w-full"
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
        </div>
      </Card.Section>

      {/* Game Title */}
      <Text
        size="md"
        fw={500}
        className="!mt-3 !mb-2 !text-gray-900 !tracking-tight !truncate"
      >
        {game.name}
      </Text>

      {/* Controls */}
      <Stack gap="xs" className="!mt-2">
        {/* Gift Checkbox */}
        <Checkbox
          label="Gift"
          checked={isGifted}
          onChange={(event) => { setIsGifted(event.currentTarget.checked) }}
          className="!text-sm"
          styles={{
            label: {
              fontSize: '0.875rem',
              color: '#666',
              paddingLeft: '4px'
            },
            input: {
              cursor: 'pointer'
            }
          }}
        />

        {/* Price Input */}
        <TextInput
          label="Price"
          placeholder="0.00"
          value={price}
          onChange={(event) => { setPrice(event.currentTarget.value) }}
          styles={{
            input: {
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              height: '36px',
              fontSize: '0.875rem',
              padding: '0 12px'
            },
            label: {
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#666',
              marginBottom: '4px'
            }
          }}
          className="!mb-2"
          type="number"
          step="0.01"
          inputMode="decimal"
        />
      </Stack>

      {/* Update Button */}
      <Group justify="flex-end" mt="xs">
        <Button
          variant="light"
          radius="md"
          onClick={updateGame}
          className="!bg-blue-50 !text-blue-600 !font-medium !transition-colors hover:!bg-blue-100 !text-sm !px-4 !py-1.5 active:!scale-95"
          style={{ touchAction: 'manipulation' }}
        >
          Update
        </Button>
      </Group>
    </Card>
  );
};

export default GameCard;