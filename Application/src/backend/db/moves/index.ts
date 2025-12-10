import db from "../connection";
import { CREATE_MOVE, GET_GAME_MOVES, GET_LAST_MOVE, GET_TURN_DIRECTION, GET_MOVE_COUNT } from "./sql";

const createMove = async (
  gameId: number,
  userId: number,
  playType: 'play' | 'draw' | 'skip' | 'reverse',
  cardId?: number,
  drawAmount?: number,
  chosenColor?: string,
  reverse: boolean = false
) =>
  db.one(CREATE_MOVE, [gameId, userId, playType, cardId, drawAmount, chosenColor, reverse]);

const getGameMoves = async (gameId: number) =>
  db.manyOrNone(GET_GAME_MOVES, [gameId]);

const getLastMove = async (gameId: number) =>
  db.oneOrNone(GET_LAST_MOVE, [gameId]);

const getTurnDirection = async (gameId: number) => {
  const result = await db.one<{ direction: number }>(GET_TURN_DIRECTION, [gameId]);
  return result.direction;
};

const getMoveCount = async (gameId: number) => {
  const result = await db.one<{ count: number }>(GET_MOVE_COUNT, [gameId]);
  return result.count;
};


export { createMove, getGameMoves, getLastMove, getTurnDirection, getMoveCount};
