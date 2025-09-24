import { useEffect, useState } from "react";
import { JWT_STORAGE, API_URL } from "../model/Constants";
import { AchievementsResponse } from "../model/Interfaces";
import { Card, Box, Title, Skeleton, Paper, Badge, Image, Text, useMantineColorScheme } from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

const PlayerAchievementCard = ({ username }: { username?: string | null }) => {

  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [achievements, setAchievements] = useState<AchievementsResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();

  useEffect(() => {
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
    const url = username ? `${API_URL}/achievements?username=${username}` : `${API_URL}/achievements`;
    setLoading(true);
    fetch(url, requestOptions)
      .then((response) => response.json())
      .then((data: AchievementsResponse[]) => {
        setAchievements(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching achievements:", error);
        setLoading(false);
      });
  }, [username]);


  // Function to get badge color based on achievement type
  const getBadgeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'gold': return 'yellow';
      case 'silver': return 'gray';
      case 'bronze': return 'orange';
      default: return 'blue';
    }
  };

  return (
    <Card shadow="sm" radius="lg" className={`!overflow-hidden !border !w-full !mb-6 ${isDarkMode ? "!border-gray-600 !bg-gray-800" : "!border-gray-100 !bg-white"}`}>
      <Box className={isDarkMode ? "!p-4 !bg-gray-700" : "!p-4 !bg-gray-50"}>
        <Title order={3} className={isDarkMode ? "!text-gray-100" : "!text-gray-800"}>
          {username ? `${username} ${t("playerAchievement", { defaultValue: "'s Achievements" })}` : t("MyAchievements", { defaultValue: "My Achievements" })}
        </Title>
      </Box>

      <Box className="!p-4">
        {loading ? (
          <Box className="!grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3 !gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={200} radius="md" />
            ))}
          </Box>
        ) : achievements.length === 0 ? (
          <Text className={`!text-center !p-4 ${isDarkMode ? "!text-gray-400" : "!text-gray-500"}`}>{t("NoAchievementsFound", { defaultValue: "No achievements found" })}</Text>
        ) : (
          <Box className="!grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3 !gap-4">
            {achievements.map((achievement, index) => (
              <Paper
                key={index}
                shadow="xs"
                radius="md"
                className={`!p-0 !overflow-hidden !border !transition-all hover:!shadow-md ${isDarkMode ? "!border-gray-600 !bg-gray-700" : "!border-gray-100 !bg-white"}`}
              >
                {/* Achievement Image */}
                <Box className={`!relative !w-full !aspect-[2/1] !overflow-hidden ${isDarkMode ? "!bg-gray-600" : "!bg-gray-100"}`}>
                  {achievement.image.filename ? (
                    <Image
                      src={achievement.image.filename?.startsWith('/uploads')
                        ? `${API_URL}${achievement.image.filename}`
                        : achievement.image.filename
                      }
                      alt={achievement.description || "Achievement"}
                      className="!w-full !h-full !object-cover"

                    />
                  ) : (
                    <Box className="!w-full !h-full !flex !items-center !justify-center !bg-gray-100">
                      <IconTrophy size={50} opacity={0.3} />
                    </Box>
                  )}
                  <Badge
                    color={getBadgeColor(achievement.level)}
                    variant="filled"
                    className="!absolute !top-2 !right-2"
                  >
                    {achievement.level || 'Standard'}
                  </Badge>
                </Box>

                {/* Achievement Details */}
                <Box className="!p-4">
                  <Text fw={600} className={`!mb-1 ${isDarkMode ? "!text-gray-100" : "!text-gray-800"}`}>
                    {achievement.achievement_id || 'Achievement'}
                  </Text>

                  {achievement.description && (
                    <Text size="sm" c="dimmed" className={`!mb-2 !line-clamp-2 ${isDarkMode ? "!text-gray-400" : "!text-gray-600"}`}>
                      {achievement.description}
                    </Text>
                  )}

                  {achievement.unlocked_at && (
                    <Text size="xs" c="dimmed" className="!text-gray-500 !mt-2">
                      Achieved on: {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </Text>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default PlayerAchievementCard;

