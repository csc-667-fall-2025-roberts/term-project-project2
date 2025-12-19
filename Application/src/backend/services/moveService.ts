import * as GameCards from "../db/cards";
import * as Games from "../db/games";
import * as Moves from "../db/moves";
import { GameState } from "../../types/types";
import { getCurrentTurn } from "./gameService";
import logger from "../lib/logger";




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

  const colorMatch = cardToPlay.color === topCard.color;
  const valueMatch = cardToPlay.value === topCard.value;


  if(colorMatch || valueMatch){
    return { valid: true };
  }

  return { valid: false, reason: "Card does not match color or value" };

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

  const players = await Games.getPlayers(gameId);
  const playerCount = players.length;

  const isReverse = card.value === "reverse";
  const isSkip = card.value === "skip";
  const isDraw2 = card.value === "draw_two";
  const isWildDraw4 = card.value === "wild_draw_four";

  logger.info(`[playACard] User ${userId} playing ${card.color} ${card.value} in game ${gameId}`);
  logger.info(`[playACard] Card effects - Reverse: ${isReverse}, Skip: ${isSkip}, Draw2: ${isDraw2}, WildDraw4: ${isWildDraw4}`);
  const treatReverseAsSkip = isReverse && playerCount === 2;

  let playType: 'play' | 'draw' | 'skip' | 'reverse' = 'play';
  if(isReverse && !treatReverseAsSkip) playType = 'reverse';
  if(isSkip || treatReverseAsSkip) playType = 'skip';

  logger.info(`[playACard] Creating move with playType: ${playType}, reverse flag: ${isReverse}`);
  console.log(`[playACard] Creating primary move: type=${playType}, cardId=${cardId}, reverse=${isReverse}`);

  await Moves.createMove(
    gameId,
    userId,
    playType,
    cardId,
    isDraw2 ? 2 : isWildDraw4 ? 4 : undefined,
    chosenColor,
    isReverse && !treatReverseAsSkip
  );
    
  if(isSkip || treatReverseAsSkip){
    console.log(`[playACard] Skip card detected - creating extra skip move to advance turn by 2`);
    await Moves.createMove(gameId, userId, 'skip', undefined, undefined, undefined, false);
  }

  if(isReverse){
    console.log(`[playACard] Reverse card played - direction will flip`);

  }

  if(isDraw2 || isWildDraw4){
    const drawCount = isDraw2 ? 2 : 4;
    console.log(`[playACard] Draw card played (${isDraw2 ? 'Draw 2' : 'Wild Draw 4'}) - next player draws ${drawCount}`);

    // Get next player AFTER the draw card move has been recorded
    const turnInfo = await getCurrentTurn(gameId);
    const nextPlayerId = turnInfo.currentPlayerId;
    console.log(`[playACard] Next player to draw: userId=${nextPlayerId}`);

    // Check if we need to recycle the discard pile before drawing
    let deckCount = await GameCards.getDeckCount(gameId);
    if(deckCount < drawCount){
      console.log(`[playACard] Not enough cards in deck (${deckCount}), recycling discard pile`);
      await GameCards.recycleDiscardPile(gameId);
      deckCount = await GameCards.getDeckCount(gameId);

      if(deckCount < drawCount){
        throw new Error("Not enough cards in deck even after recycling discard pile");
      }
    }

    await GameCards.drawCards(gameId, nextPlayerId, drawCount);
    console.log(`[playACard] Player ${nextPlayerId} drew ${drawCount} cards`);

   
    console.log(`[playACard] Creating skip move - player ${nextPlayerId} loses their turn`);
    await Moves.createMove(gameId, userId, 'skip', undefined, undefined, undefined, false);
  }

      

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
    throw new Error(" It is Not your turn");

  }

  const lastMove = await Moves.getLastMove(gameId);


  const drawAmount = lastMove && lastMove.draw_amount && lastMove.user_id !== userId
    ? lastMove.draw_amount : 0;

  const drawCount = drawAmount > 0 ? drawAmount : (count || 1);




  let deckCount = await GameCards.getDeckCount(gameId);

  // If not enough cards in deck, recycle the discard pile (keeping top card)
  if(deckCount < drawCount){
    await GameCards.recycleDiscardPile(gameId);
    deckCount = await GameCards.getDeckCount(gameId);

    // If still not enough cards after recycling, throw error
    if(deckCount < drawCount){
      throw new Error("Not enough cards in deck even after recycling discard pile");
    }
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
    throw new Error("It is Not your turn");
  }

  console.log(`[endTurn] Player ${userId} drawing and passing turn`);
  
  // Player draws a card (this doesn't count as a move/turn)
  await GameCards.drawCards(gameId, userId, 1);
  
  // Create skip move to advance to next player
  await Moves.createMove(gameId, userId, 'skip', undefined, undefined, undefined, false);
  console.log(`[endTurn] Turn advanced to next player`);

  return { success: true };
}
