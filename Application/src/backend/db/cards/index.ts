import db from "../connection";
import { CREATE_DECK, DRAW_CARDS, GET_HAND, PLAY_CARD, GET_TOP_Card, GET_HAND_COUNT, GET_DECK_COUNT }  from "./sql";
import { GameCard } from "../../../types/types";

const createDeck = (game_id: number) =>
  db.none(CREATE_DECK, [game_id]);

const drawCards = (game_id: number, player_id: number, count: number) =>
  db.manyOrNone<{ id: number }>(DRAW_CARDS, [game_id, player_id, count])
    .then(cards => cards.map(card => card.id));

const getHand = (game_id: number, player_id: number) =>
  db.manyOrNone<GameCard>(GET_HAND, [game_id, player_id]);

const playCard = (card_id: number, game_id: number, player_id: number) =>
  db.oneOrNone(PLAY_CARD, [card_id, game_id, player_id])
    .then(result => result !== null);

const getTopCard = (game_id: number) =>
  db.oneOrNone<GameCard>(GET_TOP_Card, [game_id]);

const getHandCount = (game_id: number) =>
  db.manyOrNone<{ owner_id: number; hand_count: number }>(GET_HAND_COUNT, [game_id]);

const getDeckCount = (game_id: number) =>
  db.one<{ deck_count: number }>(GET_DECK_COUNT, [game_id])
    .then(result => result.deck_count);

export { createDeck, drawCards, getHand, playCard, getTopCard, getHandCount, getDeckCount };