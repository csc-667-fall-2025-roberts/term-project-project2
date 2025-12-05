import db from "../connection";
import { CREATE_MOVE, GET_GAME_MOVES, GET_LAST_MOVE, GET_TURN_DIRECTION, GET_MOVE_COUNT } from "./sql";

const createMove = (
  gameId: number,
  userId: number,
  playType: 'play' | 'draw' | 'skip' | 'reverse',
  cardId?: number,
  drawAmount?: number,
  chosenColor?: string,
  reverse: boolean = false
) =>
  db.one(CREATE_MOVE, [gameId, userId, playType, cardId, drawAmount, chosenColor, reverse]);

const getGameMoves = (gameId: number) =>
  db.manyOrNone(GET_GAME_MOVES, [gameId]);

const getLastMove = (gameId: number) =>
  db.oneOrNone(GET_LAST_MOVE, [gameId]);

const getTurnDirection = (gameId: number) =>
  db.one<{ direction: number }>(GET_TURN_DIRECTION, [gameId])
    .then(result => result.direction);

const getMoveCount = (gameId: number) =>
  db.one<{ count: number }>(GET_MOVE_COUNT, [gameId])
    .then(result => result.count);


export { createMove, getGameMoves, getLastMove, getTurnDirection, getMoveCount};
