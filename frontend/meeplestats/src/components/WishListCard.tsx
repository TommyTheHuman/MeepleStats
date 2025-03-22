import { Card, Text, Image, Title, Badge, Group } from "@mantine/core";
import { WishListCardInterface } from "../model/Interfaces";


const WishListCard = ({ name, thumbnail, minPlayers, maxPlayers, notes, playingTime, username }: WishListCardInterface) => {
  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      className="!bg-white !border !border-gray-100 !overflow-hidden !transition-shadow hover:!shadow-md !h-full !flex !flex-col"
    >
      {/* Image Section */}
      <Card.Section>
        <div className="!relative !overflow-hidden !h-[160px]">
          <Image
            src={thumbnail}
            alt={name}
            fit="cover"
            className="!w-full !h-full !object-cover !transition-transform hover:!scale-105"
            loading="lazy"
          />
        </div>
      </Card.Section>

      {/* Content Section */}
      <Card.Section className="!px-4 !py-3 !flex-1 !flex !flex-col">
        <Title
          order={4}
          lineClamp={1}
          className="!mt-1 !mb-2 !text-gray-900 !tracking-tight"
        >
          {name}
        </Title>

        <Group gap="sm" className="!mb-2">
          <Badge
            className="!bg-blue-50 !text-blue-700 !font-normal !px-2"
            variant="light"
          >
            {minPlayers} - {maxPlayers} players
          </Badge>
          <Badge
            className="!bg-amber-50 !text-amber-700 !font-normal !px-2"
            variant="light"
          >
            {playingTime} min
          </Badge>
          <Badge
            className="!bg-green-50 !text-green-700 !font-normal !px-2"
            variant="light"
          >
            {username}
          </Badge>
        </Group>

        {notes && (
          <div className="!mt-auto">
            <Text
              size="sm"
              fw={500}
              className="!text-gray-700 !mb-1"
            >
              Notes
            </Text>
            <Text
              size="sm"
              lineClamp={3}
              className="!text-gray-600 !leading-snug !text-sm"
              style={{ wordBreak: 'break-word' }}
            >
              {notes}
            </Text>
          </div>
        )}
      </Card.Section>
    </Card>
  );
};

export default WishListCard;