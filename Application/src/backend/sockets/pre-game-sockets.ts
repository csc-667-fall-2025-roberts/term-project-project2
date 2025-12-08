import { Server } from "socket.io";
import { PLAYER_JOINED, PLAYER_LEFT, PLAYER_READY, GAME_START, GAME_STATE_UPDATE } from "../../shared/keys";
import { GameState } from "../../types/types";

export function gameRoom (gameId : number) : string {
    return `game:${gameId}`;
}

// broadcasts when a player joins the game
export function broadcastJoin(io: Server, gameId: number, userId: number, username: string): void {
    io.to(gameRoom(gameId)).emit(PLAYER_JOINED, { gameId, userId, username });
}

// broadcasts when a player leaves the game
export function broadcastLeave(io: Server, gameId: number, userId: number, username: string): void {
    io.to(gameRoom(gameId)).emit(PLAYER_LEFT, { gameId, userId, username });
}

// broadcasts when a player ready status changes
export function broadcastPlayerReady(io: Server, gameId: number, userId: number, isReady: boolean): void {
    io.to(gameRoom(gameId)).emit(PLAYER_READY, { gameId, userId, isReady });
}

// broadcasts when the game starts
export function broadcastGameStart( io: Server, gameId: number, starterId: number, topCard: { id: number; color: string; value: string }
): void {
    const room = gameRoom(gameId);
    console.log(`Broadcasting GAME_START to room: ${room}`);
    io.to(room).emit(GAME_START, { gameId, starterId, topCard});
}

// broadcasts when game state changes
export function broadcastGameStateUpdate(io: Server, gameId: number, state: GameState): void {
    io.to(gameRoom(gameId)).emit(GAME_STATE_UPDATE, { gameId, state});
}
