import db from "../connection";
import { CREATE_DECK, DRAW_CARDS, GET_HAND, PLAY_CARD, GET_TOP_Card, GET_HAND_COUNT, GET_DECK_COUNT, DEAL_CARDS, Recycle_Discard_into_Draw_Deck }  from "./sql";
import { GameCard, DisplayGameCard } from "../../../types/types";

 const createDeck = async(game_id: number)=> 
{
  await db.none(CREATE_DECK, [game_id]);
};

const drawCards = async (game_id: number, player_id: number, limit: number) => {
  return await db.many<GameCard>(DRAW_CARDS, [game_id, player_id, limit])
    
};

const dealCards = async (gameId : number, playerId : number, cardIds : number[]) => {
  await db.none( DEAL_CARDS, [gameId, playerId, cardIds ]);

}

const getHand = async (game_id: number, player_id: number) =>
  await db.manyOrNone<GameCard>(GET_HAND, [game_id, player_id]);

const playCard = async (card_id: number, game_id: number, player_id: number) => {
  const result = await db.oneOrNone(PLAY_CARD, [card_id, game_id, player_id]);
  return result !== null;
};

const getTopCard = async (game_id: number) =>
   await db.oneOrNone<DisplayGameCard>(GET_TOP_Card, [game_id]);

const getHandCount = async (game_id: number) =>
  await db.manyOrNone<{ owner_id: number; hand_count: number }>(GET_HAND_COUNT, [game_id]);

const getDeckCount = async (game_id: number) => {
  const result = await db.one<{ deck_count: number }>(GET_DECK_COUNT, [game_id]);
  return result.deck_count;
};

const recycleDiscardPile = async (gameId: number) => {
  await db.manyOrNone(Recycle_Discard_into_Draw_Deck, [gameId]);
};

const playerHands = async (gameId: number) => {
  const handCounts = await getHandCount(gameId);
  const result: Record<number, GameCard[]> = {};

  if (!handCounts) return result;

  for (const { owner_id } of handCounts) {
    const hand = await getHand(gameId, owner_id);
    if (hand && hand.length > 0) {
      result[owner_id] = hand;
    }
  }

  return result;
};

export { createDeck, drawCards, getHand, playCard, getTopCard, getHandCount, getDeckCount, dealCards, playerHands, recycleDiscardPile };