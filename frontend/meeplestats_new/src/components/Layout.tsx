import { AppShell, Group, Burger, Text, Avatar, Container, NavLink, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useContext } from "react";
import { Link, Outlet } from "react-router";
import { AuthContext } from "./AuthContext";
import { Constants } from "../model/Constants";

export default function Layout() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { authStatus, setAuthStatus } = useContext(AuthContext);

  const isLoggedIn = authStatus === "LoggedIn";

  const savedUsername = localStorage.getItem(Constants.username);

  const handleLogout = () => {
    localStorage.setItem("loggedIn", "false");
    localStorage.setItem("username", "");
    setAuthStatus("Anonymous");
  }

  const handleImportGames = () => {
    try {
      const respose = await fetch(`${process.env.REACT_APP_API_URL}/importGames`, {
        method: "GET",
        credentials: "include",
      });
      if (respose.ok) {
        console.log("Games imported");
      } else {
        console.error("Error importing games");
      }
    } catch (error) {
      console.error(error);
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
          <Text mt="md">{authStatus === "LoggedIn" ? "Utente loggato" : "Utente anonimo"}</Text>
          <NavLink component={Link} to="/" label="Home" />
          {!isLoggedIn && (
            <>
              <NavLink component={Link} to="/login" label="Login" />
              <NavLink component={Link} to="/register" label="Register" />
            </>
          )}
          {isLoggedIn && (
            <>
              <NavLink label="Logout" onClick={handleLogout} />
              <NavLink component={Link} to="/wishlist" label="Wishlist" />
              <NavLink component={Link} to="/matchHistory" label="Match History" />
              <NavLink component={Link} to="/logmatch" label="Log Match" />
              <Button onClick={handleImportGames}>Import Games</Button>
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
