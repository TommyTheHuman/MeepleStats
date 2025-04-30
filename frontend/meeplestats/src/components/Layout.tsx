import { AppShell, Group, Burger, Text, Avatar, Container, NavLink, Button, Divider, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useContext } from "react";
import { Link, Outlet } from "react-router";
import { AuthContext } from "./AuthContext";
import { API_URL, Constants, JWT_STORAGE } from "../model/Constants";

export default function Layout() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { authStatus, setAuthStatus } = useContext(AuthContext);

  const isLoggedIn = authStatus === "LoggedIn";

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
      className="!bg-gray-50"
    >
      <AppShell.Header className="!border-b !border-gray-200 !bg-white">
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
            <Text fw={600}>MeepleStats</Text>
          </Group>
          <Text size="sm" className="!text-gray-600">
            {savedUsername || 'Guest'}
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" className="!gap-0 !bg-white !border-r !border-gray-200 !flex !flex-col">
        {/* User Profile */}
        <div className="!mb-6 !flex !items-center !gap-3">
          <Avatar
            color="white"
            radius="xl"
            className="!bg-blue-500"
          >
            {savedUsername?.charAt(0).toUpperCase() || 'G'}
          </Avatar>
          <div>
            <Text fw={600} className="!text-gray-800">
              {authStatus === "LoggedIn" ? savedUsername : "Anonymous User"}
            </Text>
          </div>
        </div>

        <Divider className="!mb-4" />

        {/* Main Navigation Section */}
        <div className="!flex-1 !overflow-y-auto">
          {/* Navigation Links */}
          <NavLink
            component={Link}
            to="/"
            label="Home"
            onClick={closeMobile}
            className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
          />

          {!isLoggedIn && (
            <>
              <NavLink
                component={Link}
                to="/login"
                label="Login"
                onClick={closeMobile}
                className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
              />
              <NavLink
                component={Link}
                to="/register"
                label="Register"
                onClick={closeMobile}
                className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
              />
            </>
          )}

          {isLoggedIn && (
            <>
              <NavLink
                component={Link}
                to="/wishlist"
                label="Wishlist"
                onClick={closeMobile}
                className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
              />
              <NavLink
                component={Link}
                to="/matchHistory"
                label="Match History"
                onClick={closeMobile}
                className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
              />
              <NavLink
                component={Link}
                to="/logmatch"
                label="Log Match"
                onClick={closeMobile}
                className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
              />
              <NavLink
                component={Link}
                to="/gameCollection"
                label="Games Collection"
                onClick={closeMobile}
                className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
              />
              <NavLink
                component={Link}
                to="/matchUtility"
                label="Match Utility"
                onClick={closeMobile}
                className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
              />
              <NavLink
                component={Link}
                to="/rulebooks"
                label="Rulebook Repository"
                onClick={closeMobile}
                className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
              />
              <NavLink
                component={Link}
                to="/rulebook-chat"
                label="Rulebook Chat"
                onClick={closeMobile}
                className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
              />
              <NavLink
                component={Link}
                to="/create-scoresheet"
                label="Create Score Sheet"
                onClick={closeMobile}
                className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
              />
              <NavLink
                component={Link}
                to="/scoreSheet"
                label="Score Sheet"
                onClick={closeMobile}
                className="!transition-colors !rounded-md !mb-1 hover:!bg-gray-100"
              />

              <Divider className="!my-4" />

              <Text fw={600} className="!text-gray-800 !mb-2">
                Admin Tools
              </Text>

              <Stack gap="sm" className="!px-2 !mb-4">
                <Button
                  onClick={handleImportGames}
                  variant="light"
                  color="blue"
                  size="sm"
                  radius="md"
                  fullWidth
                  className="!bg-blue-50 !text-blue-600 hover:!bg-blue-100 !transition-colors"
                >
                  Import Games
                </Button>

                <Button
                  onClick={handleAchievementsSetup}
                  variant="light"
                  color="blue"
                  size="sm"
                  radius="md"
                  fullWidth
                  className="!bg-blue-50 !text-blue-600 hover:!bg-blue-100 !transition-colors"
                >
                  Setup Achievements
                </Button>
              </Stack>
            </>
          )}
        </div>

        {/* Footer Section - Always visible at bottom */}
        {isLoggedIn && (
          <div className="!mt-auto !pt-4">
            <Divider className="!mb-4" />
            <NavLink
              label="Logout"
              onClick={() => { handleLogout(); closeMobile(); }}
              className="!transition-colors !rounded-md !text-red-600 hover:!bg-red-50"
            />
          </div>
        )}
      </AppShell.Navbar>

      <AppShell.Main className="!bg-gray-50">
        <Container size="xxl" className="!py-4">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
