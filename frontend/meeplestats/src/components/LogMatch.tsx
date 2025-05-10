import { Box, Button, Group, LoadingOverlay, TextInput, Textarea, Select, Checkbox, NumberInput, Divider, Grid, Paper, Stack, Title, Text as MantineText } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
//import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";
import { PillsInput, Pill, Combobox, CheckIcon, useCombobox } from "@mantine/core";
import { Game, Player } from "../model/Interfaces";
import { API_URL, JWT_STORAGE } from "../model/Constants";
import { notifications } from "@mantine/notifications";



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
    <Pill key={player.name} withRemoveButton onRemove={() => handleValueRemove(player.name)} className="!bg-blue-50 !text-blue-600 !font-medium">
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
      <Paper p="xl" radius="lg" className="!bg-white !shadow-sm !border !border-gray-100">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "lg", blur: 2 }} />

          <Title order={2} ta="center" className="!font-semibold !tracking-tight !mb-6">
            Log Match
          </Title>

          {/* Game Selection Section */}
          <Box className="!mb-8">
            <MantineText className="!text-xs !uppercase !font-medium !tracking-wide !text-gray-500 mb-2">
              Game
            </MantineText>
            <Paper className="!bg-gray-50 !p-4 !rounded-xl !border !border-gray-100">
              <Select
                placeholder="Select a game"
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
                styles={{ input: { border: "none", backgroundColor: "white", borderRadius: "0.75rem" } }}
              />

              {!form.values.isCooperative && (
                <Checkbox
                  label="Team match"
                  {...form.getInputProps("isTeamMatch", { type: "checkbox" })}
                  className="mt-3"
                  styles={{
                    input: { cursor: "pointer" },
                    label: { fontWeight: 500 }
                  }}
                />
              )}
            </Paper>
          </Box>

          {/* Players Section */}
          <Box className="!mb-8">
            <MantineText className="!text-xs !uppercase !font-medium !tracking-wide !text-gray-500 !mb-2">
              Players
            </MantineText>
            <Paper className="!bg-gray-50 !p-4 !rounded-xl !border !border-gray-100">
              <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
                <Combobox.DropdownTarget>
                  <PillsInput onClick={() => combobox.openDropdown()} className="!border-0 !bg-white !rounded-xl">
                    <Pill.Group>
                      {values}
                      <Combobox.EventsTarget>
                        <PillsInput.Field
                          onFocus={() => combobox.openDropdown()}
                          onBlur={() => combobox.closeDropdown()}
                          value={search}
                          placeholder="Search players"
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
                    {options.length > 0 ? options : <Combobox.Empty>Nothing found...</Combobox.Empty>}
                  </Combobox.Options>
                </Combobox.Dropdown>
              </Combobox>

              {/* Team Match Options */}
              {form.values.isTeamMatch && (
                <Box className="!mt-6">
                  <Divider label="Team Setup" labelPosition="center" className="!mb-4 !opacity-60" />

                  <TextInput
                    placeholder="Enter team name and press Enter"
                    className="!mb-4"
                    styles={{ input: { borderRadius: "0.75rem" } }}
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
                      <MantineText size="sm" fw={500} c="dimmed">Current Teams</MantineText>
                      <Group>
                        {teams.map((team) => (
                          <Pill
                            key={team}
                            className="!bg-blue-50 !text-blue-600 !font-medium"
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
                            placeholder="Select team"
                            data={teams.map((team) => ({ value: team, label: team }))}
                            onChange={(value) => { handleTeamChange(index, value || "") }}
                            required
                            styles={{
                              input: { borderRadius: "0.75rem" },
                              label: { fontWeight: 500, fontSize: "0.875rem" }
                            }}
                          />
                        </Grid.Col>
                      ))}
                    </Grid>
                  )}

                  {teams.length > 0 && (
                    <Select
                      label="Winning Team"
                      placeholder="Select winning team"
                      data={teams.map((team) => ({ value: team, label: team }))}
                      onChange={(value) => form.setFieldValue("winningTeam", value || "")}
                      required
                      className="!mt-4"
                      styles={{
                        input: { borderRadius: "0.75rem" },
                        label: { fontWeight: 500, fontSize: "0.875rem" }
                      }}
                    />
                  )}
                </Box>
              )}

              {/* Player Scores */}
              {!form.values.isCooperative && !form.values.isTeamMatch && form.values.players.length > 0 && (
                <Box className="!mt-6">
                  <Divider label="Player Scores" labelPosition="center" className="!mb-4 !opacity-60" />

                  <Checkbox
                    label="Use manual winner selection instead of highest score"
                    checked={form.values.useManualWinner || false}
                    onChange={(event) => form.setFieldValue("useManualWinner", event.currentTarget.checked)}
                    className="!mb-4"
                    styles={{
                      input: { cursor: "pointer" },
                      label: { fontWeight: 500 }
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
                              input: { borderRadius: "0.75rem" },
                              label: { fontWeight: 500, fontSize: "0.875rem" }
                            }}
                          />

                          {form.values.useManualWinner && (
                            <Checkbox
                              label="Winner"
                              checked={form.values.manualWinner === player._id}
                              onChange={() => form.setFieldValue("manualWinner", player._id)}
                              styles={{
                                input: { cursor: "pointer" },
                                label: { fontWeight: 500 }
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
            <MantineText className="!text-xs !uppercase !font-medium !tracking-wide !text-gray-500 mb-2">
              Match Details
            </MantineText>
            <Paper className="!bg-gray-50 !p-4 !rounded-xl !border !border-gray-100">
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Duration"
                    type="number"
                    placeholder="Minutes"
                    {...form.getInputProps("duration")}
                    required
                    styles={{
                      input: { borderRadius: "0.75rem" },
                      label: { fontWeight: 500, fontSize: "0.875rem" }
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Date"
                    type="date"
                    {...form.getInputProps("date")}
                    required
                    styles={{
                      input: { borderRadius: "0.75rem" },
                      label: { fontWeight: 500, fontSize: "0.875rem" }
                    }}
                  />
                </Grid.Col>
              </Grid>

              {form.values.isCooperative && (
                <Checkbox
                  label="Match won"
                  {...form.getInputProps("isWin", { type: "checkbox" })}
                  className="!mt-4"
                  styles={{
                    input: { cursor: "pointer" },
                    label: { fontWeight: 500 }
                  }}
                />
              )}

              <TextInput
                label="Photo"
                type="file"
                onChange={(event) => {
                  const file = event.currentTarget.files ? event.currentTarget.files[0] : null;
                  form.setFieldValue("image", file);
                }}
                accept="image/*"
                className="!mt-4"
                styles={{
                  input: { borderRadius: "0.75rem" },
                  label: { fontWeight: 500, fontSize: "0.875rem" }
                }}
              />

              <Textarea
                label="Notes"
                placeholder="Any details about this match..."
                minRows={3}
                {...form.getInputProps("note")}
                className="!mt-4"
                styles={{
                  input: { borderRadius: "0.75rem" },
                  label: { fontWeight: 500, fontSize: "0.875rem" }
                }}
              />
            </Paper>
          </Box>

          <Group justify="center" className="!mt-8">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              fullWidth
              className="!bg-blue-600 !hover:bg-blue-700 !rounded-xl !h-11 !font-medium"
            >
              Log Match
            </Button>
          </Group>
        </form>
      </Paper>
    </Box>
  );
};

export default LogMatch;
