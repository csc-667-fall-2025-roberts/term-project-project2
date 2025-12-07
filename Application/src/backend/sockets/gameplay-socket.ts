import { Server } from "socket.io";
import { TURN_CHANGE, CARD_PLAY, CARD_DRAW_COMPLETED, GAME_END,PLAYER_HAND_UPDATE,SKIP,ERROR,COLOR_CHOSEN,REVERSE } from "../../shared/keys";

export function gameRoom (gameId : number) : string {
    return `game:${gameId}`;
}
// advances to next player's turn
export function broadcastTurnChange(io: Server, gameId: number, currentPlayerId: number, turnDirection: number, player_order: number) {
    io.to(gameRoom(gameId)).emit(TURN_CHANGE, { gameId, currentPlayerId, turnDirection, player_order });
}

// broadcasts a played card
export function broadcastCardPlay(io: Server, gameId: number, userId: number, username: string, card: {id: number, color: string, value: string}) {
    io.to(gameRoom(gameId)).emit(CARD_PLAY, { gameId, userId, username, card });
}

// broadcasts a draw action
export function broadcastDraw( io: Server, gameId: number, userId: number, username: string, count: number
): void { io.to(gameRoom(gameId)).emit(CARD_DRAW_COMPLETED, { gameId, userId, username,count });
}

// updates all players with hand counts
export function broadcastHandUpdate( io: Server, gameId: number, handCounts: Array<{ owner_id: number; hand_count: number }>
): void {
    const transformedCounts = handCounts.map(hc => ({userId: hc.owner_id, cardCount: hc.hand_count}));

    io.to(gameRoom(gameId)).emit(PLAYER_HAND_UPDATE, {gameId, handCounts: transformedCounts});
}

// announces the end of the game
export function broadcastGameEnd(io: Server, gameId: number, winnerId: number, winnerUsername: string
): void {
    io.to(gameRoom(gameId)).emit(GAME_END, { gameId, winnerId, winnerUsername});
}

// announces an error
export function broadcastError( io: Server, gameId: number, error: string, userId?: number
): void {
    io.to(gameRoom(gameId)).emit(ERROR, { gameId, error, userId});
}

// announces a skipped player
export function broadcastSkip( io: Server, gameId: number, skippedPlayerId: number,skippedUsername: string
): void {
    io.to(gameRoom(gameId)).emit(SKIP, { gameId, skippedPlayerId, skippedUsername});
}

// announces a reverse in play direction
export function broadcastReverse(io: Server, gameId: number, newDirection: number): void {
    io.to(gameRoom(gameId)).emit(REVERSE, { gameId, newDirection});
}

// announces a color chosen by a player
export function broadcastColorChosen( io: Server, gameId: number, userId: number, username: string, chosenColor: string
): void {
    io.to(gameRoom(gameId)).emit(COLOR_CHOSEN, { gameId, userId, username, chosenColor});
}
