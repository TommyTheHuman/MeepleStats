export interface Player {
  id: string;
  score: string;
  name: string;
  username: string;
}

export interface Game {
  name: string;
  bgg_id: string;
  is_cooperative: boolean;
  minPlayers: string;
  maxPlayers: string;
  playingTime: string;
  thumbnail: string;
  yearPublished: string;
  notes: string;
}
