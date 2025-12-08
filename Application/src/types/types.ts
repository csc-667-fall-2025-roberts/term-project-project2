export interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  created_at: Date;
}

export interface SecureUser extends User {
  password: string;
}

export interface DbChatMessage {
  id: number;
  user_id: number;
  message: string;
  created_at: Date;
}

export interface ChatMessage extends DbChatMessage {
  username: string;
  email: string;
  user_id: number;
}

export enum GameState {
  LOBBY = "lobby",
  IN_PROGRESS = "in_progress",
  ENDED = "ended",
}

export type Game = {
  id: number;
  name?: string;
  host_id: number;
  host_username?: string;
  created_at: Date;
  is_ready: boolean;
  capacity: number;
  player_count?: number;
  winner_id?: number;
  state: GameState;
};

export type GamePlayer = {
  user_id: number;
  username: string;
  display_name?: string;
  email: string;
  position: number;
  game_id: number;
  is_ready: boolean;
};

export type GameCard = {
  id: number;
  game_id: number;
  card_id: number;
  owner_id: number;
  location: number;
  value: string;
  color: string;

};

export type Card = {
  id: number;
  color: string;
  value: string;

};


