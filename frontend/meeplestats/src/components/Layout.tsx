import { AppShell, Group, Burger, Text, Avatar, Container, NavLink, Button } from "@mantine/core";
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
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
          <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
          <Text fw={500}>Logo</Text>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Avatar color="cyan" radius="xl">
          {savedUsername?.charAt(0).toUpperCase()}
        </Avatar>
        <Text mt="md">{authStatus === "LoggedIn" ? "User Logges" : "Anonymous User"}</Text>
        <NavLink component={Link} to="/" label="Home" onClick={closeMobile} />
        {!isLoggedIn && (
          <>
            <NavLink component={Link} to="/login" label="Login" onClick={closeMobile} />
            <NavLink component={Link} to="/register" label="Register" onClick={closeMobile} />
          </>
        )}
        {isLoggedIn && (
          <>
            <NavLink label="Logout" onClick={() => { handleLogout(); closeMobile(); }} />
            <NavLink component={Link} to="/wishlist" label="Wishlist" onClick={closeMobile} />
            <NavLink component={Link} to="/matchHistory" label="Match History" onClick={closeMobile} />
            <NavLink component={Link} to="/logmatch" label="Log Match" onClick={closeMobile} />
            <NavLink component={Link} to="/gameCollection" label="Games Collection" onClick={closeMobile} />
            <Button onClick={handleImportGames}>Import Games</Button>
            <Button onClick={handleAchievementsSetup}>Setup Achievements</Button>
          </>

        )}
        {/* {Array(15)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} h={28} mt="sm" animate={false} />
          ))} */}
      </AppShell.Navbar>
      <AppShell.Main>
        <Container size={"xxl"}>
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
