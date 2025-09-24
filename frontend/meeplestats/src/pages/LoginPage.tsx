import { Text } from "@mantine/core";
import LoginForm from "../components/LoginForm";
import { useTranslation } from "react-i18next";

export default function LoginPage() {

  const { t } = useTranslation();

  return (
    <>
      <Text>{t("LoginWelcomeMessage", { defaultValue: "Welcome to MeepleStats" })}</Text>
      <LoginForm />
    </>
  );
}
