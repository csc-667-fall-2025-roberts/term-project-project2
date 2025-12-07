import {Server, Socket} from "socket.io";
import * as Games from "../db/games";
import logger from "../lib/logger";

export function gameRoom (gameId : number) : string {
    return `game:${gameId}`;
}

export async function initGameSocket (socket : Socket, gameId : number, userId : number ) {
    const players = await Games.getPlayers(gameId);
    if (!players.some(player => player.user_id === userId)) {
        logger.warn(`User ${userId} tried to join game ${gameId} without being a player`);
        return
    }
    socket.join(gameRoom(gameId));
    logger.info ( `User ${userId} joined game room ${gameId}`);

}
