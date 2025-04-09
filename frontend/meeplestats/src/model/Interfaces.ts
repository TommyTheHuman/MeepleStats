import { FilterTypes } from "./Constants";

export interface Player {
  _id: string;
  score: string;
  name: string;
  username: string;
  team: string;
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
  price: string;
  isGifted: boolean;
  username: string;
}

export interface StatisticCardInterface {
  endpoint: string;
  title: string;
  filters?: filterOption[];
}

export interface filterOption {
  value: string;
  label: string;
  type: keyof typeof FilterTypes;
}

export interface MatchCardInterface {
  game_name: string;
  date: string;
  game_duration: string;
  players: { id: string, name: string, score: string }[];
  winner: { id: string, name: string, score: string };
  game_image: string;
  notes: string;
  image_url: string;
}


export interface WishListCardInterface {
  name: string;
  minPlayers: string;
  maxPlayers: string;
  playingTime: string;
  thumbnail: string;
  notes: string;
  username: string;
}

export interface StaticResponse {
  title: string;
  type: 'number' | 'percentage' | 'list' | 'comparison';
  value: number | object | Array<unknown>;
  unit?: string;
  description?: string;
}

export interface RulebookInterface {
  _id: string;
  filename: string;
  file_url: string;
  game_id: string;
  game_name: string;
  uploaded_by: string;
  uploaded_at: string;
  original_uploader?: string;
  original_rulebook_id?: string;
}

export interface RulebookChatResponse {
  answer: string;
  context?: string;
  page_refs?: Array<{
    page: string;
    file: string;
  }>;
  error?: string;
}