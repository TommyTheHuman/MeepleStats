import { Skeleton, Card, Grid } from "@mantine/core";

export default function IndexPage() {
  return (
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
  );
}