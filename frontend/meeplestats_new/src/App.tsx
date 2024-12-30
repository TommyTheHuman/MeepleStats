import { AppShell, Group, Burger, Skeleton, Text, Avatar, Card, Grid, Container } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

function App() {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

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
                {Array(15)
                    .fill(0)
                    .map((_, index) => (
                        <Skeleton key={index} h={28} mt="sm" animate={false} />
                    ))}
            </AppShell.Navbar>
            <AppShell.Main>
                <Container size={"xxl"}>
                    <Grid>
                        {Array(15)
                            .fill(0)
                            .map((_, index) => (
                                <Grid.Col key={index} span={{ base: 6, md: 4, lg: 3 }}>
                                    <Card shadow="sm" padding="xl">
                                        <Card.Section>
                                            <Skeleton h={160} animate={false} />
                                        </Card.Section>
                                        <Skeleton h={36} animate={false} mt="md" />
                                        <Skeleton h={26} animate={false} mt="md" />
                                    </Card>
                                </Grid.Col>
                            ))}
                    </Grid>
                </Container>
            </AppShell.Main>
        </AppShell>
    );
}

export default App;
