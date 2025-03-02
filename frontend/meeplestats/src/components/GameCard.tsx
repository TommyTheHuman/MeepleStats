import { Card, Checkbox, Image, TextInput, Text, Button } from "@mantine/core";
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
    <Card shadow="sm" padding="xl" radius="md">
      <Card.Section>
        <Image src={game.thumbnail} alt={game.name} height={160} mb="md" />
      </Card.Section>
      <Card.Section>
        <Text w={500} size="lg" mt="md">{game.name}</Text>
        <Checkbox
          label="Is a gift"
          checked={isGifted}
          onChange={(event) => { setIsGifted(event.currentTarget.checked) }} />
        <TextInput
          label="Price"
          placeholder="Price"
          value={price}
          onChange={(event) => { setPrice(event.currentTarget.value) }}
        />
      </Card.Section>
      <Button onClick={updateGame} mt="md">Update</Button>
    </Card>
  );
};

export default GameCard;