import { AppShell, Group, Burger, Skeleton, Text, Avatar, Container, NavLink } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useContext } from "react";
import { Link, Outlet } from "react-router";
import { AuthContext } from "./AuthContext";

export default function Layout() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { authStatus, setAuthStatus } = useContext(AuthContext);

  const isLoggedIn = authStatus === "LoggedIn";

  const handleLogout = () => {
    localStorage.setItem("loggedIn", "false");
    setAuthStatus("Anonymous");
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
          MK
        </Avatar>
        <Text mt="md">{authStatus === "LoggedIn" ? "Utente loggato" : "Utente anonimo"}</Text>
        <NavLink component={Link} to="/" label="Home" />
        {!isLoggedIn && <NavLink component={Link} to="/login" label="Login" />}
        {isLoggedIn && <NavLink label="Logout" onClick={handleLogout} />}
        {Array(15)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} h={28} mt="sm" animate={false} />
          ))}
      </AppShell.Navbar>
      <AppShell.Main>
        <Container size={"xxl"}>
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
