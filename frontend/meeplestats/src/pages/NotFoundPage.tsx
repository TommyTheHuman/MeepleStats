import { Container, Title, Text, Button, Group, Paper } from '@mantine/core';
import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <Container size="md" py="xl">
      <Paper p="xl" shadow="md" radius="md" className="!bg-white">
        <Title order={1} className="!text-gray-800 !mb-4">404 - Page Not Found</Title>
        <Text size="lg" className="!mb-6">The page you're looking for doesn't exist or has been moved.</Text>
        <Group justify="center">
          <Button component={Link} to="/" color="blue">
            Return to Home
          </Button>
        </Group>
      </Paper>
    </Container>
  );
} 