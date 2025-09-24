import { AppShell, Group, Burger, Text, Avatar, Container, NavLink, Button, Divider, Stack, ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSun, IconMoonStars } from "@tabler/icons-react";
import { useContext } from "react";
import { Link, Outlet } from "react-router";
import { AuthContext } from "./AuthContext";
import { API_URL, Constants, JWT_STORAGE, ENABLE_RAG } from "../model/Constants";
import { ThemeContext } from "../ThemeContext";
import { useTranslation } from "react-i18next";

export default function Layout() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { authStatus, setAuthStatus } = useContext(AuthContext);
  const { colorScheme, toggleColorScheme } = useContext(ThemeContext);
  const isDarkMode = colorScheme === "dark";
  const isLoggedIn = authStatus === "LoggedIn";

  const { t, i18n } = useTranslation();

  const languages = [
    { value: "en", label: "English" },
    { value: "it", label: "Italiano" },
    { value: "de", label: "Deutsch" },
    { value: "fr", label: "Français" }
  ]

  const savedUsername = localStorage.getItem(Constants.username);

  const handleLogout = () => {
    try {
      fetch(`${API_URL}/logout`, {
        method: "GET",
        credentials: "include",
      });
    } catch (error) {
      console.error(error);
      return;
    }
    localStorage.setItem("loggedIn", "false");
    localStorage.setItem("username", "");
    localStorage.setItem("jwt_token", "");
    setAuthStatus("Anonymous");
  }

  const handleImportGames = async () => {
    try {
      const requestOptions: RequestInit = {
        method: "GET",
      };
      // Check the JWT_STORAGE value and set credentials or headers accordingly
      if (JWT_STORAGE === "cookie") {
        requestOptions.credentials = "include";
      } else if (JWT_STORAGE === "localstorage") {
        requestOptions.headers = {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        };
      }

      const respose = await fetch(`${API_URL}/importGames`, requestOptions);

      if (respose.ok) {
        console.log("Games imported");
      } else {
        console.error("Error importing games");
      }
    } catch (error) {
      console.error(error);
    }
  }

  const handleAchievementsSetup = async () => {
    try {
      const requestOptions: RequestInit = {
        method: "GET",
      };
      // Check the JWT_STORAGE value and set credentials or headers accordingly
      if (JWT_STORAGE === "cookie") {
        requestOptions.credentials = "include";
      } else if (JWT_STORAGE === "localstorage") {
        requestOptions.headers = {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        };
      }

      const respose = await fetch(`${API_URL}/setupAchievements`, requestOptions);

      if (respose.ok) {
        console.log("Achievements setup");
      } else {
        console.error("Error setting up achievements");
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
      className={isDarkMode ? "!bg-gray-800 !text-gray-100" : "!bg-gray-50 !text-gray-900"}
    >
      <AppShell.Header
        className={isDarkMode ? "!bg-gray-900 !border-gray-700" : "!bg-white !border-gray-200"}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
            <Text fw={600} className={isDarkMode ? "!text-gray-100" : "!text-gray-900"}>
              MeepleStats
            </Text>
          </Group>
          <Group>
            { /** Language Selector */}
            <select
              value={i18n.language}
              onChange={e => i18n.changeLanguage(e.target.value)}
              style={{
                borderRadius: 6,
                padding: "2px 8px",
                background: isDarkMode ? "#222" : "#eee",
                color: isDarkMode ? "#fff" : "#222",
                border: "none",
                marginRight: 12,
                fontWeight: 500,
              }}
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>

            <ActionIcon
              variant="outline"
              color={isDarkMode ? "yellow" : "blue"}
              onClick={() => toggleColorScheme()}
              title="Toggle color scheme"
            >
              {isDarkMode ? <IconSun size={18} /> : <IconMoonStars size={18} />}
            </ActionIcon>
            <Text size="sm" className={isDarkMode ? "!text-gray-300" : "!text-gray-600"}>
              {savedUsername || "Guest"}
            </Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="md"
        className={isDarkMode ? "!bg-gray-900 !border-gray-700" : "!bg-white !border-gray-200"}
      >
        {/* User Profile */}
        <div className="!mb-6 !flex !items-center !gap-3">
          <Avatar
            color="white"
            radius="xl"
            className={isDarkMode ? "!bg-yellow-500" : "!bg-blue-500"}
          >
            {savedUsername?.charAt(0).toUpperCase() || "G"}
          </Avatar>
          <div>
            <Text fw={600} className={isDarkMode ? "!text-gray-100" : "!text-gray-800"}>
              {authStatus === "LoggedIn" ? savedUsername : "Anonymous User"}
            </Text>
          </div>
        </div>

        <Divider className={isDarkMode ? "!border-gray-700" : "!border-gray-200"} />

        {/* Main Navigation Section */}
        <div className="!flex-1 !overflow-y-auto">
          <NavLink
            component={Link}
            to="/"
            label={t('Home', { defaultValue: 'Home' })}
            onClick={closeMobile}
            className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
              }`}
          />

          {!isLoggedIn && (
            <>
              <NavLink
                component={Link}
                to="/login"
                label={t('Login', { defaultValue: 'Login' })}
                onClick={closeMobile}
                className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
                  }`}
              />
              <NavLink
                component={Link}
                to="/register"
                label={t('Register', { defaultValue: 'Register' })}
                onClick={closeMobile}
                className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
                  }`}
              />
            </>
          )}

          {isLoggedIn && (
            <>
              <NavLink
                component={Link}
                to="/wishlist"
                label={t('Wishlist', { defaultValue: 'Wishlist' })}
                onClick={closeMobile}
                className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
                  }`}
              />
              <NavLink
                component={Link}
                to="/matchHistory"
                label={t('Match History', { defaultValue: 'Match History' })}
                onClick={closeMobile}
                className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
                  }`}
              />
              <NavLink
                component={Link}
                to="/logmatch"
                label={t('Log Match', { defaultValue: 'Log Match' })}
                onClick={closeMobile}
                className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
                  }`}
              />
              <NavLink
                component={Link}
                to="/gameCollection"
                label={t('Games Collection', { defaultValue: 'Games Collection' })}
                onClick={closeMobile}
                className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
                  }`}
              />
              <NavLink
                component={Link}
                to="/matchUtility"
                label={t('Match Utility', { defaultValue: 'Match Utility' })}
                onClick={closeMobile}
                className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
                  }`}
              />
              {ENABLE_RAG && (
                <>
                  <NavLink
                    component={Link}
                    to="/rulebooks"
                    label={t('Rulebook Repository', { defaultValue: 'Rulebook Repository' })}
                    onClick={closeMobile}
                    className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
                      }`}
                  />
                  <NavLink
                    component={Link}
                    to="/rulebook-chat"
                    label={t('Rulebook Chat', { defaultValue: 'Rulebook Chat' })}
                    onClick={closeMobile}
                    className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
                      }`}
                  />
                </>
              )}
              <NavLink
                component={Link}
                to="/create-scoresheet"
                label={t('Create Score Sheet', { defaultValue: 'Create Score Sheet' })}
                onClick={closeMobile}
                className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
                  }`}
              />
              <NavLink
                component={Link}
                to="/scoreSheet"
                label={t('Score Sheets', { defaultValue: 'Score Sheets' })}
                onClick={closeMobile}
                className={`!transition-colors !rounded-md !mb-1 ${isDarkMode ? "hover:!bg-gray-800" : "hover:!bg-gray-100"
                  }`}
              />

              <Divider className="!my-4" />

              <Text fw={600} className={isDarkMode ? "!text-gray-100" : "!text-gray-800"}>
                {t('Admin Actions', { defaultValue: 'Admin Actions' })}
              </Text>

              <Stack gap="sm" className="!px-2 !mb-4">
                <Button
                  onClick={handleImportGames}
                  variant="light"
                  color="blue"
                  size="sm"
                  radius="md"
                  fullWidth
                  className={`!transition-colors ${isDarkMode
                    ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
                    : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
                    }`}
                >
                  {t('Import Games', { defaultValue: 'Import Games' })}
                </Button>

                <Button
                  onClick={handleAchievementsSetup}
                  variant="light"
                  color="blue"
                  size="sm"
                  radius="md"
                  fullWidth
                  className={`!transition-colors ${isDarkMode
                    ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
                    : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
                    }`}
                >
                  {t('Setup Achievements', { defaultValue: 'Setup Achievements' })}
                </Button>
              </Stack>
            </>
          )}
        </div>

        {isLoggedIn && (
          <div className="!mt-auto !pt-4">
            <Divider className={isDarkMode ? "!border-gray-700" : "!border-gray-200"} />
            <NavLink
              label={t('Logout', { defaultValue: 'Logout' })}
              onClick={() => {
                handleLogout();
                closeMobile();
              }}
              className={`!transition-colors !rounded-md ${isDarkMode ? "!text-red-400 hover:!bg-red-900" : "!text-red-600 hover:!bg-red-50"
                }`}
            />
          </div>
        )}
      </AppShell.Navbar>

      <AppShell.Main className={isDarkMode ? "!bg-gray-900" : "!bg-gray-50"}>
        <Container size="xxl" className="!py-4">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
