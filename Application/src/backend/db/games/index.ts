import type { Game, GamePlayer } from "../../../types/types";
import { GameState } from "../../../types/types";
import db from "../connection";
import {CREATE_GAME, GAME_BY_ID, GAMES_BY_USER, JOIN_GAME, LIST_GAMES, GET_PLAYERS, SET_PLAYER_POSITION, START_GAME, UPDATE_GAME, LEAVE_GAME, GET_PLAYER_COUNT,CHECK_PLAYER_IN_GAME,
} from "./sql";

const create = (user_id: number, name?: string, capacity: number = 4) =>
  db.one<Game>(CREATE_GAME, [user_id, name, capacity]);

const join = (game_id: number, user_id: number) =>
  db.none(JOIN_GAME, [game_id, user_id]);

const list = (state: GameState = GameState.LOBBY, limit: number = 50) =>
  db.manyOrNone<Game>(LIST_GAMES, [state, limit]);

const getByUser = (user_id: number) =>
  db.manyOrNone<Game>(GAMES_BY_USER, [user_id]);

const get = (game_id: number) =>
  db.one<Game>(GAME_BY_ID, [game_id]);

const getPlayers = (game_id: number) =>
  db.manyOrNone<GamePlayer>(GET_PLAYERS, [game_id]);

const setPlayerPosition = (game_id: number, player_order: number, user_id: number) =>
  db.none(SET_PLAYER_POSITION, [game_id, player_order, user_id]);

const startGame = (game_id: number) =>
  db.none(START_GAME, [game_id]);

const updateGame = (game_id: number, state?: GameState, winner_id?: number, is_ready?: boolean) =>
  db.one<Game>(UPDATE_GAME, [game_id, state, winner_id, is_ready]);

const leaveGame = (game_id: number, user_id: number) =>
  db.none(LEAVE_GAME, [game_id, user_id]);

const getPlayerCount = (game_id: number) =>
  db.one<{ count: number }>(GET_PLAYER_COUNT, [game_id])
    .then(result => result.count);

const checkPlayerInGame = (game_id: number, user_id: number) =>
  db.one<{ is_player: boolean }>(CHECK_PLAYER_IN_GAME, [game_id, user_id])
    .then(result => result.is_player);

export {create,get,getByUser,join,list,getPlayers,setPlayerPosition,startGame,updateGame,leaveGame,
  getPlayerCount,
  checkPlayerInGame,
};
