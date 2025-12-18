import { ChatMessage } from "../../../types/types";
import db from "../connection";
import { CREATE_GAME_MESSAGE, CREATE_LOBBY_MESSAGE, RECENT_GAME_MESSAGES, RECENT_LOBBY_MESSAGES } from "./sql";

const lobbyMessage = async (limit: number = 50) => {
  return await db.manyOrNone<ChatMessage>(RECENT_LOBBY_MESSAGES, [limit]);
};

const gameMessage = async (game_id: number, limit: number = 50, user_id: number) => {
  return await db.manyOrNone<ChatMessage>(RECENT_GAME_MESSAGES, [game_id, user_id, limit]);

};

const createLobbyMessage = async (user_id: number, message: string) => {
  return await db.one<ChatMessage>(CREATE_LOBBY_MESSAGE, [user_id, message]);
};

const createGameMessage = async (user_id: number, message: string, game_id: number) => {
  return await db.one<ChatMessage>(CREATE_GAME_MESSAGE, [user_id, message, game_id]);
};
export { createLobbyMessage, lobbyMessage, createGameMessage, gameMessage };