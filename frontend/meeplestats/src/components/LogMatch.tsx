import { Box, Button, Group, LoadingOverlay, TextInput, Textarea, Select, Checkbox, NumberInput, Divider, Grid, Paper, Stack, Title, Text as MantineText, useMantineColorScheme } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
//import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";
import { PillsInput, Pill, Combobox, CheckIcon, useCombobox } from "@mantine/core";
import { Game, Player } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";


const LogMatch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex("active"),
  });

  const { t } = useTranslation();

  const { colorScheme } = useMantineColorScheme();
  const isDarkMode = colorScheme === "dark";

  const form = useForm({
    initialValues: {
      game: "",
      game_id: "",
      note: "",
      date: new Date().toISOString().split("T")[0],
      image: null as File | null,
      players: [] as Player[],
      duration: "",
      isCooperative: false,
      isWin: false,
      isTeamMatch: false,
      winningTeam: "",
      useManualWinner: false,
      manualWinner: "",
    },
  });

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

    fetch(`${API_URL}/games`, requestOptions)
      .then((response) => response.json())
      .then((data: Game[]) => {
        const sortedGames = data.sort((a, b) => a.name.localeCompare(b.name));
        setGames(sortedGames);
      })
      .catch((error) => console.error("Error fetching games:", error));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/players`)
      .then((response) => response.json())
      .then((data: Player[]) => {
        const sortedPlayers = data.sort((a, b) =>
          a.username.localeCompare(b.username)
        );
        setPlayers(sortedPlayers);
      })
      .catch((error) => console.error("Error fetching players:", error));
  }, []);

  useEffect(() => {
    if (!form.values.isTeamMatch) {
      // Clear the teams array if the match is not a team match
      if (teams.length > 0) {
        setTeams([]);
      }
      // Clear the winning team if the match is not a team match
      if (form.values.winningTeam) {
        form.setFieldValue("winningTeam", "");
      }
      // Only update players if at least one player's team is not empty
      const hasNonEmptyTeam = form.values.players.some((player) => player.team !== "");
      if (hasNonEmptyTeam) {
        const updatedPlayers = form.values.players.map((player) => ({
          ...player,
          team: ""
        }));
        form.setFieldValue("players", updatedPlayers);
      }
    }
  }, [form, teams]);

  const handleValueSelect = (username: string) => {
    const selectedPlayer = players.find((player) => player.username === username);
    if (selectedPlayer) {
      console.log("Selected player:", selectedPlayer);
      form.setFieldValue("players", [
        ...form.values.players,
        { _id: selectedPlayer._id, score: "", name: selectedPlayer.username, username: selectedPlayer.username, team: "" },
      ]);
    }
  };

  const handleGameSelect = (gameName: string) => {
    const selectedGame = games.find((game) => game.name === gameName);
    if (selectedGame) {
      form.setFieldValue("game", selectedGame.name);
      form.setFieldValue("game_id", selectedGame.bgg_id);
      form.setFieldValue("isCooperative", selectedGame.is_cooperative);
    }
  };

  const handleScoreChange = (index: number, score: string) => {
    const updatedPlayers = [...form.values.players];
    updatedPlayers[index].score = score;
    form.setFieldValue("players", updatedPlayers);
  };

  const handleTeamChange = (index: number, team: string) => {
    const updatedPlayers = [...form.values.players];
    updatedPlayers[index].team = team;
    form.setFieldValue("players", updatedPlayers);
  }

  const handleValueRemove = (username: string) => {
    form.setFieldValue(
      "players",
      form.values.players.filter((player) => player.name !== username)
    );
  };

  const handleAddTeam = (teamName: string) => {
    if (teamName && !teams.includes(teamName)) {
      setTeams([...teams, teamName]);
    }
  };

  const values = form.values.players.map((player) => (
    <Pill
      key={player.name}
      withRemoveButton
      onRemove={() => handleValueRemove(player.name)}
      className={`!font-medium ${isDarkMode ? "!bg-blue-900 !text-blue-200" : "!bg-blue-50 !text-blue-600"}`}
    >
      {player.name}
    </Pill>
  ));

  const options = players
    .filter((player) => player.username.toLowerCase().includes(search.trim().toLowerCase()))
    .map((player) => (
      <Combobox.Option
        value={player.username}
        key={player.username}
        active={form.values.players.some((p) => p.name === player.username)}
      >
        <Group gap="sm">
          {form.values.players.some((p) => p.name === player.username) ? <CheckIcon size={12} /> : null}
          <span>{player.username}</span>
        </Group>
      </Combobox.Option>
    ));

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    const data = new FormData();
    data.append("game", values.game);
    data.append("game_id", values.game_id);
    data.append("note", values.note);
    data.append("date", values.date);
    if (values.image) {
      data.append("image", values.image);
    }
    data.append("duration", values.duration);
    data.append("isWin", values.isWin.toString());
    data.append("isTeamMatch", values.isTeamMatch.toString());
    data.append("winningTeam", values.winningTeam);

    data.append("useManualWinner", values.useManualWinner.toString());
    data.append("manualWinner", values.manualWinner);

    if (Array.isArray(values.players)) {
      values.players.forEach((player, index) => {
        data.append(`players[${index}][id]`, player._id);
        data.append(`players[${index}][score]`, player.score);
        data.append(`players[${index}][name]`, player.name);
        data.append(`players[${index}][team]`, player.team);
      });
    }
    //console.log("Data:", values);
    try {

      const requestOptions: RequestInit = {
        method: "POST",
      };

      // Check the JWT_STORAGE value and set credentials or headers accordingly
      if (JWT_STORAGE === "cookie") {
        requestOptions.credentials = "include";
      } else if (JWT_STORAGE === "localstorage") {
        requestOptions.headers = {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        };
      }

      requestOptions.body = data;

      const response = await fetch(`${API_URL}/logmatch`, requestOptions);

      if (response.ok) {
        const data = await response.json();
        console.log("Success:", data);
        notifications.show({
          color: "green",
          title: "Success",
          message: "Match logged successfully!",
        });
        navigate("/matchHistory");
      } else {
        console.error("Error:", response.statusText);
        notifications.show({
          color: "red",
          title: "Error",
          message: `Failed to log match: ${response.statusText}`,
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="!mx-auto !max-w-2xl">
      <Paper
        p="xl"
        radius="lg"
        className={`!shadow-sm !border ${isDarkMode ? "!bg-gray-800 !border-gray-700" : "!bg-white !border-gray-100"
          }`}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "lg", blur: 2 }} />

          <Title order={2} ta="center" className="!font-semibold !tracking-tight !mb-6">
            {t("LogMatchTitle", { defaultValue: "Log Match" })}
          </Title>

          {/* Game Selection Section */}
          <Box className="!mb-8">
            <MantineText
              className={`!text-xs !uppercase !font-medium !tracking-wide ${isDarkMode ? "!text-gray-400" : "!text-gray-500"
                } !mb-2`}
            >
              {t("LogMatchGameSection", { defaultValue: "Game" })}
            </MantineText>
            <Paper
              className={`!p-4 !rounded-xl !border ${isDarkMode ? "!bg-gray-700 !border-gray-600" : "!bg-gray-50 !border-gray-100"
                }`}
            >
              <Select
                placeholder={t("LogMatchGameSelectPlaceholder", { defaultValue: "Select a game" })}
                data={games.map((game) => ({ value: game.name, label: game.name }))}
                onChange={(value) => {
                  if (value) {
                    handleGameSelect(value);
                  }
                  if (value !== null) {
                    form.setFieldValue("game", value);
                  }
                }}
                value={form.values.game}
                required
                searchable
                className="mb-2"
                styles={{
                  input: {
                    border: "1px solid",
                    borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                    backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                    borderRadius: "0.5rem",
                    color: isDarkMode ? "white" : "black",
                  },
                }}
              />

              {!form.values.isCooperative && (
                <Checkbox
                  label={t("LogMatchTeamMatch", { defaultValue: "Team match" })}
                  {...form.getInputProps("isTeamMatch", { type: "checkbox" })}
                  className="mt-3"
                  styles={{
                    input: { cursor: "pointer" },
                    label: { fontWeight: 500, color: isDarkMode ? "white" : "black" },
                  }}
                />
              )}
            </Paper>
          </Box>

          {/* Players Section */}
          <Box className="!mb-8">
            <MantineText className={`!text-xs !uppercase !font-medium !tracking-wide ${isDarkMode ? "!text-gray-400" : "!text-gray-500"
              } !mb-2`}>
              {t("LogMatchPlayersSection", { defaultValue: "Players" })}
            </MantineText>
            <Paper
              className={`!p-4 !rounded-xl !border ${isDarkMode ? "!bg-gray-700 !border-gray-600" : "!bg-gray-50 !border-gray-100"
                }`}
            >
              <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
                <Combobox.DropdownTarget>
                  <PillsInput
                    className={`!rounded-xl ${isDarkMode ? "!text-white" : "!text-black"}`}
                    onClick={() => combobox.openDropdown()}
                    styles={{
                      input: {
                        border: "1px solid",
                        borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                        borderRadius: "0.5rem",
                        backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                        color: isDarkMode ? "white" : "black",
                      },
                    }}
                  >
                    <Pill.Group>
                      {values}
                      <Combobox.EventsTarget>
                        <PillsInput.Field
                          onFocus={() => combobox.openDropdown()}
                          onBlur={() => combobox.closeDropdown()}
                          value={search}
                          placeholder={t("LogMatchPlayerSearchPlaceholder", { defaultValue: "Search players" })}
                          onChange={(event) => {
                            combobox.updateSelectedOptionIndex();
                            setSearch(event.currentTarget.value);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Backspace" && search.length === 0) {
                              event.preventDefault();
                              handleValueRemove(form.values.players[form.values.players.length - 1]?.name);
                            }
                          }}
                        />
                      </Combobox.EventsTarget>
                    </Pill.Group>
                  </PillsInput>
                </Combobox.DropdownTarget>
                <Combobox.Dropdown>
                  <Combobox.Options>
                    {options.length > 0 ? options : <Combobox.Empty>{t("LogMatchPlayerSearchNotFound", { defaultValue: "Nothing found..." })}</Combobox.Empty>}
                  </Combobox.Options>
                </Combobox.Dropdown>
              </Combobox>

              {/* Team Match Options */}
              {form.values.isTeamMatch && (
                <Box className="!mt-6">
                  <Divider
                    label={t("LogMatchTeamSetup", { defaultValue: "Team Setup" })}
                    labelPosition="center"
                    className={`!mb-4 ${isDarkMode ? "!border-gray-600 !text-gray-400" : "!opacity-60"
                      }`}
                  />

                  <TextInput
                    placeholder={t("LogMatchTeamNamePlaceholder", { defaultValue: "Enter team name and press Enter" })}
                    className="!mb-4"
                    styles={{
                      input: {
                        border: "1px solid",
                        borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                        borderRadius: "0.5rem",
                        backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                        color: isDarkMode ? "white" : "black",
                      },
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTeam(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />

                  {teams.length > 0 && (
                    <Stack className="!mb-4">
                      <MantineText size="sm" fw={500} c="dimmed">{t("LogMatchCurrentTeams", { defaultValue: "Current Teams" })}</MantineText>
                      <Group>
                        {teams.map((team) => (
                          <Pill
                            key={team}
                            className={`!font-medium ${isDarkMode ? "!bg-blue-900 !text-blue-200" : "!bg-blue-50 !text-blue-600"}`}
                          >
                            {team}
                          </Pill>
                        ))}
                      </Group>
                    </Stack>
                  )}

                  {form.values.players.length > 0 && (
                    <Grid>
                      {form.values.players.map((player, index) => (
                        <Grid.Col span={6} key={player._id}>
                          <Select
                            label={`${player.name}`}
                            placeholder={t("LogMatchTeamSelectPlaceholder", { defaultValue: "Select team" })}
                            data={teams.map((team) => ({ value: team, label: team }))}
                            onChange={(value) => { handleTeamChange(index, value || "") }}
                            required
                            styles={{
                              input: {
                                border: "1px solid",
                                borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                                borderRadius: "0.5rem",
                                backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                                color: isDarkMode ? "white" : "black",
                              },
                              label: { fontWeight: 500, fontSize: "0.875rem", color: isDarkMode ? "white" : "black" }
                            }}
                          />
                        </Grid.Col>
                      ))}
                    </Grid>
                  )}

                  {teams.length > 0 && (
                    <Select
                      label={t("LogMatchWinningTeam", { defaultValue: "Winning Team" })}
                      placeholder={t("LogMatchWinningTeamPlaceholder", { defaultValue: "Select winning team" })}
                      data={teams.map((team) => ({ value: team, label: team }))}
                      onChange={(value) => form.setFieldValue("winningTeam", value || "")}
                      required
                      className="!mt-4"
                      styles={{
                        input: {
                          border: "1px solid",
                          borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                          borderRadius: "0.5rem",
                          backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                          color: isDarkMode ? "white" : "black",
                        },
                        label: { fontWeight: 500, fontSize: "0.875rem", color: isDarkMode ? "white" : "black" }
                      }}
                    />
                  )}
                </Box>
              )}

              {/* Player Scores */}
              {!form.values.isCooperative && !form.values.isTeamMatch && form.values.players.length > 0 && (
                <Box className="!mt-6">
                  <Divider label={t("LogMatchPlayerScores", { defaultValue: "Player Scores" })} labelPosition="center" className="!mb-4 !opacity-60" />

                  <Checkbox
                    label={t("LogMatchUseManualWinner", { defaultValue: "Use manual winner selection instead of highest score" })}
                    checked={form.values.useManualWinner || false}
                    onChange={(event) => form.setFieldValue("useManualWinner", event.currentTarget.checked)}
                    className="!mb-4"
                    styles={{
                      input: { cursor: "pointer" },
                      label: { fontWeight: 500, color: isDarkMode ? "white" : "black" }
                    }}
                  />

                  <Grid>
                    {form.values.players.map((player, index) => (
                      <Grid.Col span={form.values.useManualWinner ? 12 : 6} key={player._id}>
                        <Group align="flex-end" gap="sm" grow>
                          <NumberInput
                            label={player.name}
                            value={parseInt(player.score) || 0}
                            onChange={(value) => handleScoreChange(index, value?.toString() || "0")}
                            min={0}
                            required={!form.values.useManualWinner}
                            disabled={form.values.useManualWinner}
                            styles={{
                              input: {
                                border: "1px solid",
                                borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                                borderRadius: "0.5rem",
                                backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                                color: isDarkMode ? "white" : "black",
                              },
                              label: { fontWeight: 500, fontSize: "0.875rem", color: isDarkMode ? "white" : "black" },
                            }}
                          />

                          {form.values.useManualWinner && (
                            <Checkbox
                              label={t("LogMatchWinner", { defaultValue: "Winner" })}
                              checked={form.values.manualWinner === player._id}
                              onChange={() => form.setFieldValue("manualWinner", player._id)}
                              styles={{
                                input: { cursor: "pointer" },
                                label: { fontWeight: 500, color: isDarkMode ? "white" : "black" },
                              }}
                            />
                          )}
                        </Group>
                      </Grid.Col>
                    ))}
                  </Grid>
                </Box>
              )}
            </Paper>
          </Box>

          {/* Match Details Section */}
          <Box className="!mb-8">
            <MantineText
              className={`!text-xs !uppercase !font-medium !tracking-wide ${isDarkMode ? "!text-gray-400" : "!text-gray-500"
                } !mb-2`}
            >
              {t("LogMatchDetails", { defaultValue: "Match Details" })}
            </MantineText>
            <Paper
              className={`!p-4 !rounded-xl !border ${isDarkMode ? "!bg-gray-700 !border-gray-600" : "!bg-gray-50 !border-gray-100"
                }`}
            >
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label={t("LogMatchDuration", { defaultValue: "Duration" })}
                    type="number"
                    placeholder={t("LogMatchDurationPlaceholder", { defaultValue: "Minutes" })}
                    {...form.getInputProps("duration")}
                    required
                    styles={{
                      input: {
                        border: "1px solid",
                        borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                        borderRadius: "0.5rem",
                        backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                        color: isDarkMode ? "white" : "black",
                      },
                      label: { fontWeight: 500, fontSize: "0.875rem", color: isDarkMode ? "white" : "black" },
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label={t("LogMatchDate", { defaultValue: "Date" })}
                    type="date"
                    {...form.getInputProps("date")}
                    required
                    styles={{
                      input: {
                        border: "1px solid",
                        borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                        borderRadius: "0.5rem",
                        backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                        color: isDarkMode ? "white" : "black",
                      },
                      label: { fontWeight: 500, fontSize: "0.875rem", color: isDarkMode ? "white" : "black" },
                    }}
                  />
                </Grid.Col>
              </Grid>

              {form.values.isCooperative && (
                <Checkbox
                  label={t("LogMatchWon", { defaultValue: "Match won" })}
                  {...form.getInputProps("isWin", { type: "checkbox" })}
                  className="!mt-4"
                  styles={{
                    input: { cursor: "pointer" },
                    label: { fontWeight: 500, color: isDarkMode ? "white" : "black" },
                  }}
                />
              )}

              <TextInput
                label={t("LogMatchPhoto", { defaultValue: "Photo" })}
                type="file"
                onChange={(event) => {
                  const file = event.currentTarget.files ? event.currentTarget.files[0] : null;
                  form.setFieldValue("image", file);
                }}
                accept="image/*"
                className="!mt-4"
                styles={{
                  input: {
                    border: "1px solid",
                    borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                    borderRadius: "0.5rem",
                    backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                    color: isDarkMode ? "white" : "black",
                  },
                  label: { fontWeight: 500, fontSize: "0.875rem", color: isDarkMode ? "white" : "black" },
                }}
              />

              <Textarea
                label={t("LogMatchNotes", { defaultValue: "Notes" })}
                placeholder={t("LogMatchNotesPlaceholder", { defaultValue: "Any details about this match..." })}
                minRows={3}
                {...form.getInputProps("note")}
                className="!mt-4"
                styles={{
                  input: {
                    border: "1px solid",
                    borderColor: isDarkMode ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                    borderRadius: "0.5rem",
                    backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "white",
                    color: isDarkMode ? "white" : "black",
                  },
                  label: { fontWeight: 500, fontSize: "0.875rem", color: isDarkMode ? "white" : "black" },
                }}
              />
            </Paper>
          </Box>

          <Group justify="center" className="!mt-8">
            <Button
              type="submit"
              variant="light"
              color="blue"
              size="lg"
              disabled={loading}
              fullWidth
              radius="md"
              className={`!transition-colors !font-medium ${isDarkMode
                ? "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
                : "!bg-blue-50 !text-blue-600 hover:!bg-blue-100"
                }`}
            >
              {t("LogMatchSubmit", { defaultValue: "Log Match" })}
            </Button>
          </Group>
        </form>
      </Paper>
    </Box>
  );
};

export default LogMatch;
