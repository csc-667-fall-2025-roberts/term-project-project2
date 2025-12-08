import express, { response } from "express";
import { Server } from "socket.io";
import { Games } from "../db";
import logger from "../lib/logger";
import { broadcastPlayerReady } from "../sockets/pre-game-sockets";

const router = express.Router();

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const gameId = parseInt(id);
    const { id: userId, username } = req.session.user!;

    const game = await Games.get(gameId);
    logger.info("Readyup game data:", game);

    if (!game) {
      return res.status(404).render("errors/404", { url: req.originalUrl });
    }

    const isPlayerInGame = await Games.checkPlayerInGame(gameId, userId);
    if (!isPlayerInGame) {
      await Games.join(gameId, userId);
      logger.info(`User ${userId} automatically joined game ${gameId}`);

      const io = req.app.get("io") as Server;
      const { broadcastJoin } = await import("../sockets/pre-game-sockets");
      broadcastJoin(io, gameId, userId, username);
    }

    res.render("readyup/readyup", { ...game });
  } catch (err) {
    next(err);
  }
});

router.post("/:game_id/toggle", async (req, res) => {
  try {
    const gameId = parseInt(req.params.game_id);
    const { id: userId } = req.session.user!;

    const isReady = await Games.togglePlayerReady(gameId, userId);

    const io = req.app.get("io") as Server;
    broadcastPlayerReady(io, gameId, userId, isReady);

    res.status(200).json({ isReady });
  } catch (error: any) {
    logger.error("Error toggling ready status:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get ( "/:game_id/players", async (request,response) => {
  try {
    const gameId = parseInt(request.params.game_id);
    const players = await Games.getPlayers(gameId);
    const game = await Games.get(gameId);
    const {id: userId} = request.session.user!;
    const isPlayerInGame = await Games.checkPlayerInGame(gameId, userId);
    if (!isPlayerInGame) {
      return response.status(403).json({ error: "User not in game" });
    }

    response.json({ players, currentUserId: userId, capacity: game.capacity })
  } catch (error: any) {
    logger.error("Error fetching readyup players:", error);
    response.status(500).json({ error: error.message });
  }
});

export default router;