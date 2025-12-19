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
) => {
  console.log(`[DB createMove] Game ${gameId}, User ${userId}, Type: ${playType}, CardId: ${cardId}, Reverse: ${reverse}`);
  return db.one(CREATE_MOVE, [gameId, userId, playType, cardId, drawAmount, chosenColor, reverse]);
};

const getGameMoves = async (gameId: number) =>
  db.manyOrNone(GET_GAME_MOVES, [gameId]);

const getLastMove = async (gameId: number) =>
  db.oneOrNone(GET_LAST_MOVE, [gameId]);

const getTurnDirection = async (gameId: number) => {
  const result = await db.one<{ direction: number }>(GET_TURN_DIRECTION, [gameId]);
  console.log(`[DB getTurnDirection] Game ${gameId}: Direction = ${result.direction}`);
  return result.direction;
};

const getMoveCount = async (gameId: number) => {
  const allMoves = await db.manyOrNone('SELECT id, play_type, card_id, draw_amount FROM moves WHERE game_id = $1 ORDER BY id', [gameId]);
  console.log(`[DB getMoveCount] All moves for game ${gameId}:`, JSON.stringify(allMoves, null, 2));
  
  const result = await db.one<{ count: number }>(GET_MOVE_COUNT, [gameId]);
  console.log(`[DB getMoveCount] Game ${gameId}: Count = ${result.count}`);
  return result.count;
};


export { createMove, getGameMoves, getLastMove, getTurnDirection, getMoveCount};
