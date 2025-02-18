import { useNavigate } from "react-router";
import { useForm } from "@mantine/form";
import { useContext, useState } from "react";
import { Box, Button, Group, LoadingOverlay, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { API_URL, Constants, JWT_STORAGE } from "../model/Constants";
import { AuthContext } from "./AuthContext";


const RegisterForm = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const { setAuthStatus } = useContext(AuthContext);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      username: "",
      mail: "",
      password: "",
      confirmPassword: "",
    },

    validate: {
      username: (value) => {
        return value.length > 0 ? null : "Invalid username";
      },
      mail: (value) => {
        return value.length > 0 ? null : "Invalid mail";
      },
      password: (value) => {
        return value.length > 0 ? null : "Invalid password";
      },
      confirmPassword: (value, values): string | null => {
        // Check if the password is the same as the confirmPassword
        return value === values.password ? null : "Passwords do not match";
      }
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    let response = null as Response | null;

    try {
      response = await fetch(`${API_URL}/register`, {
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
        title: "Errore",
        message: "Errore di rete: " + error,
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
    <Box>
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          withAsterisk
          label="Username"
          key={form.key("username")}
          {...form.getInputProps("username")}
          mb={form.errors.username ? "xs" : "md"}
        />
        <TextInput
          withAsterisk
          label="Mail"
          key={form.key("mail")}
          {...form.getInputProps("mail")}
          mb={form.errors.mail ? "xs" : "md"}
        />
        <TextInput
          withAsterisk
          label="Password"
          type="password"
          key={form.key("password")}
          {...form.getInputProps("password")}
          mb={form.errors.password ? "xs" : "md"}
        />
        <TextInput
          withAsterisk
          label="Confirm Password"
          type="password"
          key={form.key("confirmPassword")}
          {...form.getInputProps("confirmPassword")}
          mb={form.errors.confirmPassword ? "xs" : "md"}
        />
        <Group justify="space-between" mt="md">
          <Button type="submit" disabled={loading}>
            Registrati
          </Button>
        </Group>
      </form>
    </Box>
  );

}

export default RegisterForm;