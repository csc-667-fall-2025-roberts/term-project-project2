import type { Game, GamePlayer } from "../../../types/types";
import { GameState } from "../../../types/types";
import db from "../connection";
import {CREATE_GAME, GAME_BY_ID, GAMES_BY_USER, JOIN_GAME, LIST_GAMES, GET_PLAYERS, SET_PLAYER_POSITION, START_GAME, UPDATE_GAME, LEAVE_GAME, GET_PLAYER_COUNT,CHECK_PLAYER_IN_GAME, TOGGLE_PLAYER_READY, GET_CURRENT_TURN_PLAYER
} from "./sql";

const create = async (user_id: number, name?: string, capacity: number = 4) =>
  await db.one<Game>(CREATE_GAME, [user_id, name, capacity]);

const join = async (game_id: number, user_id: number) =>
  await db.none(JOIN_GAME, [game_id, user_id]);

const list = async (state: GameState = GameState.LOBBY, limit: number = 50) =>
  await db.manyOrNone<Game>(LIST_GAMES, [state, limit]);

const getByUser = async (user_id: number) =>
  await db.manyOrNone<Game>(GAMES_BY_USER, [user_id]);

const get = async (game_id: number) =>
  await db.one<Game>(GAME_BY_ID, [game_id]);

const getPlayers = async (game_id: number) =>
  await db.manyOrNone<GamePlayer>(GET_PLAYERS, [game_id]);

const setPlayerPosition = async (game_id: number, player_order: number, user_id: number) =>
  await db.none(SET_PLAYER_POSITION, [game_id, player_order, user_id]);

const startGame = async (game_id: number) =>
  await db.none(START_GAME, [game_id],); // add active?

const updateGame = async (game_id: number, state?: GameState, winner_id?: number, is_ready?: boolean) =>
  await db.one<Game>(UPDATE_GAME, [game_id, state, winner_id, is_ready]);

const leaveGame = async (game_id: number, user_id: number) =>
  await db.none(LEAVE_GAME, [game_id, user_id]);

const getPlayerCount = async (game_id: number) => {
  const result = await db.one<{ count: number }>(GET_PLAYER_COUNT, [game_id]);
  return result.count;
};

const checkPlayerInGame = async (game_id: number, user_id: number) => {
  const result = await db.one<{ is_player: boolean }>(CHECK_PLAYER_IN_GAME, [game_id, user_id]);
  return result.is_player;
};

const togglePlayerReady = async (game_id: number, user_id: number) => {
  const result = await db.one<{ is_ready: boolean }>(TOGGLE_PLAYER_READY, [game_id, user_id]);
  return result.is_ready;
};

const getCurrentPlayer= async (game_id: number) => {
  const result = await db.one<{ user_id: number; player_order: number }>(GET_CURRENT_TURN_PLAYER, [game_id]);
  return result;
};

export {create,get,getByUser,join,list,getPlayers,setPlayerPosition,startGame,updateGame,leaveGame,
  getPlayerCount,
  checkPlayerInGame,
  togglePlayerReady,
  getCurrentPlayer,
};
