import * as GameCards from "../db/cards";
import * as Games from "../db/games";
import type { GamePlayer } from "../../types/types";

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
  const players = await Games.getPlayers(gameId);
  if(players.length < 2){
    throw new Error ("Not enough players to start the game");
  }

  const playerIds = players.map((p: GamePlayer) => p.user_id);

  await GameCards.createDeck(gameId);

  const shuffledPlayers = shuffle(playerIds);

  // Deal cards to each player and set their position
  for (let i = 0; i < shuffledPlayers.length; i++){
    const playerId = shuffledPlayers[i];
    await GameCards.drawCards(gameId, playerId, Cards_Per_Player);
    await Games.setPlayerPosition(gameId, i+1, playerId);
  }

  await Games.startGame(gameId);

  return {firstPlayerId: shuffledPlayers[0]};
}

