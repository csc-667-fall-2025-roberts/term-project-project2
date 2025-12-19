import * as GameCards from "../db/cards";
import * as Games from "../db/games";
import * as Moves from "../db/moves";
import type { GamePlayer, GameCard } from "../../types/types";
import { GameState } from "../../types/types";
import logger from "../lib/logger";

const Cards_Per_Player = 7;


//fisher-yates shuffle
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
    }
  
return result; 
  }

export async function StartGame(gameId: number): Promise<{firstPlayerId: number}> {
  const game = await Games.get(gameId);

  if(game.state !== GameState.LOBBY){
    throw new Error("Game has already been started or ended");
  }

  const players = await Games.getPlayers(gameId);

  if(players.length < 2){
    throw new Error("Not enough players ");
  }

  const playerIds = players.map((p: GamePlayer) => p.user_id);

  await GameCards.createDeck(gameId);

  const shuffledPlayers = shuffle(playerIds);

  for (let i = 0; i < shuffledPlayers.length; i++){
    const playerId = shuffledPlayers[i];
    await GameCards.drawCards(gameId, playerId, Cards_Per_Player);
    await Games.setPlayerPosition(gameId, i+1, playerId);
  }

  let attempts = 0;
  let validStarter = false;
  let starterCardId: number | undefined;

  while(!validStarter && attempts < 20){
    await GameCards.drawCards(gameId, 0, 1);
    const topCards = await GameCards.getHand(gameId, 0);

    if(topCards.length > 0){
      const starterCard = topCards[0];
      const isValidStarter = starterCard.color !== "wild" &&
                            !["skip", "reverse", "draw_two", "wild_draw_four"].includes(starterCard.value);

      if(isValidStarter){
        await GameCards.playCard(starterCard.id, gameId, 0);
        starterCardId = starterCard.id;
        validStarter = true;
      }
    }
    attempts++;
  }

  if(!validStarter){
    const topCards = await GameCards.getHand(gameId, 0);
    if(topCards.length > 0){
      await GameCards.playCard(topCards[0].id, gameId, 0);
      starterCardId = topCards[0].id;
    }
  }

  if(starterCardId){
    await Moves.createMove(gameId, shuffledPlayers[0], 'play', starterCardId);
    logger.info(`Starter card ID ${starterCardId} played to start game ${gameId}`);
  }


  await Games.startGame(gameId);

  return {firstPlayerId: shuffledPlayers[0]};
}

export async function getCurrentTurn (gameId : number ) : Promise<{
currentPlayerId: number;
playerOrder : number;
direction: number;
}>
{
const players = await Games.getPlayers(gameId);
const moveCount = await Moves.getMoveCount(gameId);
const direction = await Moves.getTurnDirection(gameId);
const lastMove = await Moves.getLastMove(gameId);


if (players.length === 0) {
  throw new Error("No players in the game");

}

const sortedPlayers = players.sort((a, b) => a.position - b.position);
const playerCount = sortedPlayers.length;

let currentTurn: number;

if (playerCount === 2) {
  // 2 players: just alternate (direction doesn't matter visually)
  currentTurn = moveCount % playerCount;
} else {
  // 3+ players: respect direction
  if (direction === 1) {
    // Clockwise: 0 -> 1 -> 2 -> 3 -> 0...
    currentTurn = moveCount % playerCount;
  } else {
    // Counter-clockwise: 0 -> 3 -> 2 -> 1 -> 0...
    currentTurn = (-moveCount % playerCount + playerCount) % playerCount;
  }
}

const currentId = sortedPlayers[currentTurn];

return {
  currentPlayerId: currentId.user_id, playerOrder: currentId.position || 1, direction
}
  
}


 


export async function endGame(gameId: number, winnerId?: number): Promise<void> {


  const game = await Games.get(gameId);

  if(game.state === GameState.ENDED){
    throw new Error("Game has already ended");
  }

  await Games.updateGame(gameId, GameState.ENDED, winnerId, true);
}

export async function getGameState(gameId: number): Promise<{
  playerHands: any[];
  currentPlayer: any;
  players: GamePlayer[];
  topDiscardCard: GameCard | null;
}> {
  const players = await Games.getPlayers(gameId);

  const playerHands = await Promise.all(
    players.map(async (player) => ({
      user_id: player.user_id,
      username: player.username,
      cards: await GameCards.getHand(gameId, player.user_id),
      cardCount: (await GameCards.getHand(gameId, player.user_id)).length
    }))
  );

  const currentTurnInfo = await getCurrentTurn(gameId);

  const discardPile = await GameCards.getHand(gameId, 0);
  const topDiscardCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  return {
    playerHands,
    currentPlayer: currentTurnInfo,
    players,
    topDiscardCard
  };
}