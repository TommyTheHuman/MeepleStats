import { Box, Button, Group, LoadingOverlay, TextInput, useMantineColorScheme } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useContext, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";
import { API_URL, Constants, JWT_STORAGE } from "../model/Constants";
import { AuthContext } from "./AuthContext";


const LoginForm = () => {
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";
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
      const data = await response.json();

      if (JWT_STORAGE === 'localstorage') {
        localStorage.setItem('jwt_token', data.jwt_token);
      }

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
    <Box
      pos="relative"
      w={320}
      mx="auto"
      className={isDarkMode ? "!bg-gray-800 !text-gray-100" : "!bg-white !text-gray-900"}
      style={{
        borderRadius: "8px",
        padding: "16px",
        boxShadow: isDarkMode ? "0 2px 4px rgba(0, 0, 0, 0.5)" : "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <TextInput
          withAsterisk
          label="Username"
          key={form.key("username")}
          {...form.getInputProps("username")}
          mb={form.errors.username ? "xs" : "md"}
          onKeyDown={handleUsernamelKeyDown}
          styles={{
            input: {
              border: "1px solid",
              borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
              borderRadius: "0.5rem",
              backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
              color: isDarkMode ? "white" : "black",
            },
            label: {
              color: isDarkMode ? "white" : "black",
            },
          }}
        />

        <TextInput
          withAsterisk
          label="Password"
          type="password"
          key={form.key("password")}
          {...form.getInputProps("password")}
          mb={form.errors.password ? "xs" : "md"}
          ref={passwordRef}
          styles={{
            input: {
              border: "1px solid",
              borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
              borderRadius: "0.5rem",
              backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
              color: isDarkMode ? "white" : "black",
            },
            label: {
              color: isDarkMode ? "white" : "black",
            },
          }}
        />

        <Group justify="space-between" mt="md">
          <Button
            type="submit"
            disabled={loading}
            variant="light"
            color="blue"
            radius="md"
            className={`!transition-colors !font-medium ${isDarkMode
              ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
              : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
              }`}
          >
            Login
          </Button>
        </Group>
      </form>
    </Box>
  );
};

export default LoginForm;
