import express from "express";
import { Server } from "socket.io";
import { GAME_CREATE,GAME_LISTING } from "../../shared/keys";
import { Games, Cards } from "../db";
import logger from "../lib/logger";
import { StartGame, getCurrentTurn, endGame } from "../services/gameService";
import { playACard, drawCards, endTurn } from "../services/moveService";

const router = express.Router();

router.get("/", async (request, response) => {
  const sessionId = request.session.id;

  response.status(202).send();

  const games = await Games.list();
  const io = request.app.get("io") as Server;

  io.to(sessionId).emit(GAME_LISTING, games);
});

router.post("/", async (request, response) => {
  try {
    const { id } = request.session.user!;
    const { name, max_players } = request.body;

    const maxPlayers = max_players ? parseInt(max_players) : 4;
    logger.info(`Create game request ${name}, ${maxPlayers} by ${id}`);
    const game = await Games.create(id, name, maxPlayers);
    logger.info(`Game created: ${game.id}`);

    const io = request.app.get("io") as Server;
    io.emit(GAME_CREATE, { ...game });

    response.redirect(`/games/${game.id}`);
  } catch (error: any) {
    logger.error("Error creating game:", error);
    response.redirect("/lobby");
  }
});

router.get("/:id", async (request, response) => {
  const gameId = parseInt(request.params.id);
  const user = request.session.user!;

  const game = await Games.get(gameId);
  const card_data = await Cards.getHand(gameId, user.id);
  const myCards = card_data.map((c) => ({ id: c.id, color: c.color, value: c.value}));

  response.render("games/game", {
    ...game,
    currentUserid: user.id,
    currentUserName: user.username,
    myCards
  });
});

router.post("/:game_id/join", async (request, response) => {
  const { id } = request.session.user!;
  const { game_id } = request.params;

  await Games.join(parseInt(game_id), id);

  response.redirect(`/games/${game_id}`);
});

// start game route 
router.post( "/:game_id/start", async (request, response) => {
  try {
  const gameId = parseInt(request.params.game_id);
  await StartGame(gameId);
  response.redirect(`/games/${gameId}`); // change later braodcast to players
  } catch (error: any) {
    logger.error("Error starting game:", error);
    response.redirect(`/games/${request.params.game_id}`);
  }
});

// get current turn route
router.get("/:game_id/turn", async (request, response) => {
  try {
    const gameId = parseInt(request.params.game_id);
    const turnInfo = await getCurrentTurn(gameId);
    response.status(200).json(turnInfo);
  } catch (error: any) {
    logger.error("Error getting current Turns:", error);
    response.status(500).json({ error: error.message});

  }
});


router.post("/:game_id/end", async (request, response) => {
  try {
    const gameId = parseInt(request.params.game_id);
    const { winnerId } = request.body;

    await endGame(gameId, winnerId);

    response.status(202).json({ message: "Game ended successfully" });
  } catch (error: any) {
    logger.error("Error ending game:", error);
    response.status(500).json({ error: error.message });
  }
});

// play a card route
router.post("/:game_id/play", async (request, response) => {
  try {
    const gameId = parseInt(request.params.game_id);
    const { id: userId } = request.session.user!;
    const { cardId, chosenColor } = request.body;

    const result = await playACard(gameId, userId, cardId, chosenColor);

    if (!result.success) {
      return response.status(400).json({ error: result.message });
    }

    if (result.winner) {
      return response.status(200).json({
        message: result.message,
        winner: result.winner
      });
    }

    response.status(200).json({ message: "Card played successfully" });
  } catch (error: any) {
    logger.error("Error playing card:", error);
    response.status(500).json({ error: error.message });
  }
});

// draw cards route
router.post("/:game_id/draw", async (request, response) => {
  try {
    const gameId = parseInt(request.params.game_id);
    const { id: userId } = request.session.user!;
    const { count } = request.body;

    const result = await drawCards(gameId, userId, count || 1);

    response.status(200).json({
      message: "Cards drawn successfully",
      cardIds: result.cardIds
    });
  } catch (error: any) {
    logger.error("Error drawing cards:", error);
    response.status(500).json({ error: error.message });
  }
});

// end turn route
router.post("/:game_id/end-turn", async (request, response) => {
  try {
    const gameId = parseInt(request.params.game_id);
    const { id: userId } = request.session.user!;

    await endTurn(gameId, userId);

    response.status(200).json({ message: "Turn ended successfully" });
  } catch (error: any) {
    logger.error("Error ending turn:", error);
    response.status(500).json({ error: error.message });
  }
});


export default router;