import * as GameCards from "../db/cards";
import * as Games from "../db/games";
import * as Moves from "../db/moves";
import type { GamePlayer, GameCard } from "../../types/types";
import { GameState } from "../../types/types";

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
    throw new Error("Not enough players to start the game");
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

  while(!validStarter && attempts < 20){
    await GameCards.drawCards(gameId, 0, 1);
    const topCards = await GameCards.getHand(gameId, 0);

    if(topCards.length > 0){
      const starterCard = topCards[0];
      const isValidStarter = starterCard.color !== "wild" &&
                            !["skip", "reverse", "draw2", "wild_draw4"].includes(starterCard.value);

      if(isValidStarter){
        await GameCards.playCard(starterCard.id, gameId, 0);
        validStarter = true;
      }
    }
    attempts++;
  }

  if(!validStarter){
    const topCards = await GameCards.getHand(gameId, 0);
    if(topCards.length > 0){
      await GameCards.playCard(topCards[0].id, gameId, 0);
    }
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


if (players.length === 0) {
  throw new Error("No players in the game");

}

const sortedPlayers = players.sort((a, b) => a.position - b.position); 
const playerCount = sortedPlayers.length;

let currentTurnIndex = moveCount % playerCount;

if ( direction === -1 && moveCount > 0) {
  currentTurnIndex = (playerCount - currentTurnIndex) % playerCount;

}

const currentPlayerId = sortedPlayers[currentTurnIndex]

return {
  currentPlayerId: currentPlayerId.user_id, playerOrder: currentPlayerId.position, direction
}

}

export async function endGame(gameId: number, winnerId?: number): Promise<void> {
 

  const game = await Games.get(gameId);

  if(game.state === GameState.ENDED){
    throw new Error("Game has already ended");
  }

  await Games.updateGame(gameId, GameState.ENDED, winnerId, true);
}