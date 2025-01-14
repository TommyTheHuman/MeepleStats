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
}
