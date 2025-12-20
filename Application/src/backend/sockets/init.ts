import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { GLOBAL_ROOM } from "../../shared/keys";
import { sessionMiddleware } from "../config/session";
import { Games } from "../db";
import logger from "../lib/logger";
import { User } from "../../types/types";
import { initGameSocket } from "./game-socket";

export const initSockets = (httpServer: HTTPServer) => {
  const io = new Server(httpServer);

  io.engine.use(sessionMiddleware);

  io.on("connection", (socket) => {
    // Session may be missing for some connections; guard access.
    const reqAny = socket.request as any;
    const session = (reqAny?.session ?? undefined) as { id?: string; user?: User } | undefined;

    if (session?.id) {
      logger.info(`socket for user session ${session.id} established`);
      socket.join(session.id);
    } else {
      logger.warn("socket connection without session id; joining global room only");
    }

    socket.join(GLOBAL_ROOM);

    const gameId = socket.handshake.query.gameId as string;
    if (gameId && session?.user?.id) {
      initGameSocket(socket, parseInt(gameId), session.user.id);
    } else if (gameId) {
      logger.warn("socket connection missing user; skipping game socket init");
    }
    
    socket.on("close", () => {
      if (session?.user?.username) {
        logger.info(`socket for user ${session.user.username} closed`);
      } else {
        logger.info("socket closed");
      }
    });
  });

  return io;
};
