import { Card, Image, Text, Group, Badge, Box, Modal, Button } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { MatchCardInterface } from "../model/Interfaces";
import { IconPhoto } from "@tabler/icons-react";
import { API_URL } from "../model/Constants";

const MatchCard = ({ game_name, date, game_duration, game_image, players, winner, notes, image_url }: MatchCardInterface) => {

  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Card shadow="sm" radius="lg" className="!overflow-hidden !border !border-gray-100 !min-w-[280px]">
      {/* Image container with fixed dimensions */}
      <Card.Section>
        <div className="!relative !overflow-hidden !h-[160px]">
          <Image
            src={game_image}
            alt={game_name}
            fit="cover"
            loading="lazy"
            className="!w-full !h-full !object-cover !transition-transform hover:!scale-105"
          />
        </div>
      </Card.Section>
      <Box className="!p-4">
        {/* Game title with truncation */}
        <Text fw={600} size="lg" lineClamp={1} title={game_name} className="!text-[17px] !tracking-tight">
          {game_name}
        </Text>

        {/* Date and duration */}
        <Group justify="space-between" className="!mt-1 !mb-3">
          <Text c="dimmed" size="sm" className="!text-gray-500">
            {new Date(date).toLocaleDateString()}
          </Text>
          <Badge variant="light" color="blue" size="sm" className="!font-medium !px-2 !bg-blue-50 !text-blue-600 !border-0">
            {game_duration} min
          </Badge>
        </Group>

        {/* Divider */}
        <Box className="!w-full !h-px !bg-gray-100 !my-3"></Box>

        {/* Players list */}
        <Text fw={500} size="sm" className="!mb-2 !text-gray-700">
          Players:
        </Text>

        {players.map((player, index) => (
          <Group key={index} justify="space-between" className={`!py-1 ${index < players.length - 1 ? '!border-b !border-gray-50' : ''}`}>
            <Box className="!flex !items-center !gap-1 !max-w-[70%]">
              <Text
                size="sm"
                fw={player.id === winner.id ? 600 : 400}
                c={player.id === winner.id ? "blue.6" : "gray.7"}
                className={`!truncate ${player.id === winner.id ? '!text-blue-600' : '!text-gray-700'}`}
                title={player.name}
              >
                {player.name}
              </Text>
              {player.id === winner.id && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="!flex-shrink-0 !text-blue-600">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </Box>
            <Text size="sm" fw={500} className={player.id === winner.id ? '!text-blue-600' : '!text-gray-700'}>
              {player.score}
            </Text>
          </Group>
        ))}


        {/* Notes - Only shown if notes exist */}
        {notes && (
          <>
            <Box className="!w-full !h-px !bg-gray-100 !my-3"></Box>

            <Text fw={500} size="sm" className="!mb-2 !text-gray-700">
              Notes:
            </Text>
            <Text size="sm" c="dimmed" className="!text-gray-500 !line-clamp-2">
              {notes}
            </Text>
          </>
        )}

        <Modal
          opened={opened}
          onClose={close}
          title="Match Photo"
          size="lg"
          centered
          padding="md"
          classNames={{
            title: "!text-gray-800 !font-medium",
            body: "!flex !justify-center !items-center"
          }}
        >
          <Box className="!max-h-[70vh] !overflow-hidden">
            <Image
              src={image_url?.startsWith('/uploads')
                ? `${API_URL}${image_url}`
                : image_url
              }
              alt={game_name || "Match photo"}
              fit="contain"
              height="auto"
              className="!max-h-[70vh] !object-contain"
            />
          </Box>
        </Modal>

        {/* Photo button positioned better */}
        {image_url && (
          <Box className="!flex !justify-end !mt-2">
            <Button
              onClick={open}
              variant="light"
              color="blue"
              radius="md"
              size="sm"
              className="!bg-blue-50 !text-blue-600 hover:!bg-blue-100 !transition-colors"
              p={8}
            >
              <IconPhoto size={18} stroke={1.5} />
            </Button>
          </Box>
        )}

      </Box>
    </Card>
  );
};

export default MatchCard;