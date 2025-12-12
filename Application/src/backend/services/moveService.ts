import * as GameCards from "../db/cards";
import * as Games from "../db/games";
import * as Moves from "../db/moves";
import { GameState } from "../../types/types";
import { getCurrentTurn } from "./gameService";




export async function validatePlay(gameId: number, userId: number, cardId: number, chosenColor?: string
): Promise<{ valid: boolean; reason?: string}> {

  const game = await Games.get(gameId);

  if(game.state !== GameState.IN_PROGRESS){
    return { valid: false, reason: "Game is not in progress" };
  }

  const currentPlayerId = await getCurrentTurn(gameId);

  if(currentPlayerId.currentPlayerId !== userId){
    return { valid: false, reason: "Not your turn" };
  }

  const playerHand = await GameCards.getHand(gameId, userId);


  const cardToPlay = playerHand.find(c => c.id === cardId);

  if(!cardToPlay){
    return { valid: false, reason: "Card not in your hand" };
  }

  const topCard = await GameCards.getTopCard(gameId);

  if(!topCard){
    return { valid: true };
  }

  if(cardToPlay.color === "wild"){
    if(!chosenColor){
      return { valid: false, reason: "Must choose a color for wild card" };
    }

    return { valid: true };
  }

  if(cardToPlay.color === topCard.color || cardToPlay.value === topCard.value){
    return { valid: true };
  }

  return { valid: false, reason: "Card doesn't match color or value" };
}




export async function playACard(
  gameId: number,
  userId: number,
  cardId: number,
  chosenColor?: string
): Promise<{ success: boolean; message?: string; winner?: number }> {

  const validation = await validatePlay(gameId, userId, cardId, chosenColor);
  if(!validation.valid){
    return { success: false, message: validation.reason };
  }

  const playerHand = await GameCards.getHand(gameId, userId);
  const card = playerHand.find(c => c.id === cardId);

  if(!card){
    return { success: false, message: "Card not found" };
  }

  const played = await GameCards.playCard(cardId, gameId, userId);
  if(!played){
    return { success: false, message: "Failed to play card" };
  }

  const isReverse = card.value === "reverse";
  const isSkip = card.value === "skip";
  const isDraw2 = card.value === "draw_two";
  const isWildDraw4 = card.value === "wild_draw_four";

  let playType: 'play' | 'draw' | 'skip' | 'reverse' = 'play';
  if(isReverse) playType = 'reverse';
  if(isSkip) playType = 'skip';

  await Moves.createMove(
    gameId,
    userId,
    playType,
    cardId,
    isDraw2 ? 2 : isWildDraw4 ? 4 : undefined,
    chosenColor,
    isReverse
  );

  const remainingCards = await GameCards.getHand(gameId, userId);
  if(remainingCards.length === 0){
    await Games.updateGame(gameId, GameState.ENDED, userId, true);
    return { success: true, message: "You win!", winner: userId };
  }

  return { success: true };
}




export async function drawCards(
  gameId: number,
  userId: number,
  count?: number
): Promise<{ success: boolean; cardIds: number[] }> {

  const game = await Games.get(gameId);

  if(game.state !== GameState.IN_PROGRESS){
    throw new Error("Game is not in progress");
  }

  const { currentPlayerId } = await getCurrentTurn(gameId);
  if(currentPlayerId !== userId){
    throw new Error("Not your turn");

  }

  const lastMove = await Moves.getLastMove(gameId);

  const drawAmount = lastMove && (lastMove.draw_count && lastMove.owner_id === userId)
    ? lastMove.draw_count : 0;

  const drawCount = drawAmount > 0 ? drawAmount : (count || 1);




  const deckCount = await GameCards.getDeckCount(gameId);
  if(deckCount < drawCount){
    throw new Error("Not enough cards in deck");
  }

  const drawnCards = await GameCards.drawCards(gameId, userId, drawCount);
  const cardIds = drawnCards.map(card => card.id);

  return { success: true, cardIds };
}

export async function endTurn(
  gameId: number,
  userId: number
): Promise<{ success: boolean }> {

  const game = await Games.get(gameId);

  if(game.state !== GameState.IN_PROGRESS){
    throw new Error("Game is not in progress");
  }

  const { currentPlayerId } = await getCurrentTurn(gameId);
  if(currentPlayerId !== userId){
    throw new Error("Not your turn");
  }

  await Moves.createMove(gameId, userId, 'draw', undefined, undefined, undefined, false);

  return { success: true };
}
