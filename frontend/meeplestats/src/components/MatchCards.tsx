import { Card, Image, Text, Group, Badge, Box, Modal, Button, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { MatchCardInterface } from "../model/Interfaces";
import { IconPhoto } from "@tabler/icons-react";
import { API_URL } from "../model/Constants";
import { useTranslation } from "react-i18next";

const MatchCard = ({ game_name, date, game_duration, game_image, players, winner, notes, image_url, is_cooperative, is_team_match, winning_team, use_manual_winner }: MatchCardInterface) => {

  const [opened, { open, close }] = useDisclosure(false);

  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";

  const { t } = useTranslation();

  const isWinner = (playerId: string) => {
    if (is_cooperative) {
      // For coop games, check if winner array has players (win) or is empty (loss)
      return Array.isArray(winner) && winner.length > 0 && winner.some(w => w.id === playerId);
    } else if (is_team_match) {
      // For team matches, check if player is in the winner array
      return Array.isArray(winner) && winner.some(w => w.id === playerId);
    } else {
      // For competitive matches, check if this player has the winner id
      return winner && !Array.isArray(winner) && winner.id === playerId;
    }
  };

  const detectManualWinner = () => {
    // If we have the explicit flag, use it
    if (typeof use_manual_winner !== 'undefined') {
      return use_manual_winner;
    }
    else {
      return false;
    }
  };

  const isManualWinner = detectManualWinner();

  return (
    <Card shadow="sm" radius="lg" className={`!overflow-hidden !border !w-[280px] ${isDarkMode ? "!border-gray-600 !bg-gray-800" : "!border-gray-100 !bg-white"}`}>
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
        <Text fw={600} size="lg" lineClamp={1} title={game_name} className={`!text-[17px] !tracking-tight ${isDarkMode ? "!text-white" : "!text-black"}`}>
          {game_name}
        </Text>

        {/* Date and duration */}
        <Group justify="space-between" className="!mt-1 !mb-3">
          <Text c="dimmed" size="sm" className={isDarkMode ? "!text-gray-400" : "!text-gray-500"}>
            {new Date(date).toLocaleDateString()}
          </Text>
          <Badge variant="light" color="blue" size="sm" className={`!font-medium !px-2 !border-0 ${isDarkMode ? "!bg-blue-900 !text-blue-200" : "!bg-blue-50 !text-blue-600"}`}>
            {game_duration} {t("min", { defaultValue: "min" })}
          </Badge>
        </Group>

        {/* Game Type & Result */}
        {is_cooperative && (
          <Badge
            variant="light"
            color={Array.isArray(winner) && winner.length > 0 ? "green" : "red"}
            size="sm"
            className="!mb-3"
          >
            {Array.isArray(winner) && winner.length > 0 ? "Cooperative Win" : "Cooperative Loss"}
          </Badge>
        )}

        {is_team_match && winning_team && (
          <Badge
            variant="light"
            color="green"
            size="sm"
            className="!mb-3"
          >
            {t("WinningTeam", { defaultValue: "Winning Team" })}: {winning_team}
          </Badge>
        )}

        {!is_cooperative && !is_team_match && isManualWinner && (
          <Badge
            variant="light"
            color="violet"
            size="sm"
            className="!mb-3"
          >
            {t("SpecialVictory", { defaultValue: "Special Victory" })}
          </Badge>
        )}

        {/* Divider */}
        <Box className={`!w-full !h-px !my-3 ${isDarkMode ? "!bg-gray-600" : "!bg-gray-100"}`}></Box>

        {/* Players list */}
        <Text fw={500} size="sm" className={`!mb-2 ${isDarkMode ? "!text-gray-200" : "!text-gray-700"}`}>
          {t("MatchCardPlayers", { defaultValue: "Players" })}:
        </Text>

        {players.map((player, index) => (
          <Group key={index} justify="space-between" className={`!py-1 ${index < players.length - 1 ? `!border-b ${isDarkMode ? "!border-gray-600" : "!border-gray-50"}` : ''}`}>
            <Box className="!flex !items-center !gap-1 !max-w-[70%]">
              <Text
                size="sm"
                fw={isWinner(player.id) ? 600 : 400}
                c={isWinner(player.id) ? "blue.6" : "gray.7"}
                className={`!truncate ${isWinner(player.id) ? '!text-blue-600' : (isDarkMode ? '!text-gray-300' : '!text-gray-700')}`}
                title={player.name}
              >
                {player.name}
                {player.team && is_team_match && (
                  <span className={`!ml-1 !text-xs ${isDarkMode ? "!text-gray-400" : "!text-gray-500"}`}>
                    ({player.team})
                  </span>
                )}
              </Text>
              {isWinner(player.id) && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="!flex-shrink-0 !text-blue-600">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </Box>

            {/* Only show scores for competitive (non-cooperative, non-team) matches */}
            {!is_cooperative && !is_team_match && !isManualWinner && (
              <Text size="sm" fw={500} className={isWinner(player.id) ? '!text-blue-600' : (isDarkMode ? '!text-gray-300' : '!text-gray-700')}>
                {player.score}
              </Text>
            )}
          </Group>
        ))}

        {/* Notes - Only shown if notes exist */}
        {notes && (
          <>
            <Box className={`!w-full !h-px !my-3 ${isDarkMode ? "!bg-gray-600" : "!bg-gray-100"}`}></Box>

            <Text fw={500} size="sm" className={`!mb-2 ${isDarkMode ? "!text-gray-200" : "!text-gray-700"}`}>
              {t("MatchCardNotes", { defaultValue: "Notes" })}:
            </Text>
            <Text
              size="sm"
              c="dimmed"
              className={`!line-clamp-2 !break-all !whitespace-normal ${isDarkMode ? "!text-gray-400" : "!text-gray-500"}`}
              style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
            >
              {notes}
            </Text>
          </>
        )}

        <Modal
          opened={opened}
          onClose={close}
          title={<>{t("MatchCardMatchPhoto", { defaultValue: "Match Photo" })}</>}
          size="lg"
          centered
          padding="md"
          classNames={{
            title: `!font-medium ${isDarkMode ? "!text-gray-100" : "!text-gray-800"}`,
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
              className={`!transition-colors ${isDarkMode ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600" : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"}`}
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