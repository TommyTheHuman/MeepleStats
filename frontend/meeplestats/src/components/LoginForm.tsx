import { Box, Button, Group, LoadingOverlay, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useContext, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";
import { API_URL, Constants } from "../model/Constants";
import { AuthContext } from "./AuthContext";


const LoginForm = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const { setAuthStatus } = useContext(AuthContext);

  const savedUsername = localStorage.getItem(Constants.username);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      username: savedUsername || "",
      password: "",
    },

    validate: {
      username: (value) => {
        return value.length > 0 ? null : "Username is not valid";
      },
      password: (value) => {
        return value.length > 0 ? null : "Password is not valid";
      },
    },
  });

  const passwordRef = useRef<HTMLInputElement>(null);

  const handleUsernamelKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && passwordRef.current) {
      event.preventDefault();
      passwordRef.current.focus();
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    let response = null as Response | null;

    try {
      response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include",
      });
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Network error: " + error,
      });
    } finally {
      setLoading(false);
    }

    if (response != null && response.ok) {
      //const data = await response.json();
      localStorage.setItem(Constants.username, values.username);
      localStorage.setItem(Constants.loggedIn, "true");
      setAuthStatus("LoggedIn");
      navigate("/");
    } else {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Invalid credentials",
      });
    }
  };

  return (
    <Box pos="relative" w={320} mx="auto">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <TextInput
          withAsterisk
          label="Username"
          key={form.key("username")}
          {...form.getInputProps("username")}
          mb={form.errors.username ? "xs" : "md"}
          onKeyDown={handleUsernamelKeyDown}
        />

        <TextInput
          withAsterisk
          label="Password"
          type="password"
          key={form.key("password")}
          {...form.getInputProps("password")}
          mb={form.errors.password ? "xs" : "md"}
          ref={passwordRef}
        />

        <Group justify="space-between" mt="md">
          <Button type="submit" disabled={loading}>
            Login
          </Button>
        </Group>
      </form>
    </Box>
  );
};

export default LoginForm;
