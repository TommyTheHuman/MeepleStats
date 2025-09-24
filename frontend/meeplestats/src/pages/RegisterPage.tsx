import { Text } from "@mantine/core";
import RegisterForm from "../components/RegisterForm";
import { useTranslation } from "react-i18next";

export default function RegisterPage() {
  const { t } = useTranslation();
  return (
    <>
      <Text>{t("RegisterWelcomeMessage", { defaultValue: "Welcome to MeepleStats" })}</Text>
      <RegisterForm />
    </>
  );
}