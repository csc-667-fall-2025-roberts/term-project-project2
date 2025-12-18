import express from "express";
import { CHAT_LISTING, CHAT_MESSAGE, GLOBAL_ROOM } from "../../shared/keys";
import { Chat } from "../db";
import { gameRoom } from "../sockets/pre-game-sockets";

const router = express.Router();

router.get("/", async (request, response) => {
  const { id } = request.session.user!;
  const { game_id } = request.query;

  const io = request.app.get("io");
  const sessionId = request.session.id;

  if (game_id) {
    const gameId = parseInt(game_id as string);
    const messages = await Chat.gameMessage(gameId, 50, id);
    io.to(sessionId).emit(CHAT_LISTING, { messages });
  } else {
    const messages = await Chat.lobbyMessage();
    io.to(sessionId).emit(CHAT_LISTING, { messages });
  }

  response.status(202).send();
});

router.post("/", async (request, response) => {
  const { id } = request.session.user!;
  const { message, game_id } = request.body;

  const io = request.app.get("io");

  if (game_id) {
    const gameId = parseInt(game_id);
    const result = await Chat.createGameMessage(id, message, gameId);
    io.to(gameRoom(gameId)).emit(CHAT_MESSAGE, result);
  } else {
    const result = await Chat.createLobbyMessage(id, message);
    io.to(GLOBAL_ROOM).emit(CHAT_MESSAGE, result);
  }

  response.status(202).send();
});

export default router;
