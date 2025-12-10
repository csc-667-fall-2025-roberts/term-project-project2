import express from "express";
import { Server } from "socket.io";
import { GAME_CREATE,GAME_LISTING } from "../../shared/keys";
import { Games, Cards } from "../db";
import logger from "../lib/logger";
import { StartGame, getCurrentTurn, endGame } from "../services/gameService";
import { playACard, drawCards, endTurn } from "../services/moveService";
import { broadcastJoin, broadcastGameStart, broadcastGameStateUpdate } from "../sockets/pre-game-sockets";
import { broadcastTurnChange, broadcastCardPlay, broadcastDraw, broadcastHandUpdate, broadcastGameEnd, broadcastSkip, broadcastReverse, broadcastColorChosen } from "../sockets/gameplay-socket";
import { GameState } from "../../types/types";

const router = express.Router();



router.get("/", async (request, response) => {
  const sessionId = request.session.id;
  const userId = request.session.user!.id;

  response.status(202).send();

  const allGames = await Games.list();
  const userGames = await Games.getByUser(userId);

  // Separate games into user's games and available games
  const userGameIds = new Set(userGames.map((g) => g.id));
  const myGames = allGames.filter((g) => userGameIds.has(g.id));
  const availableGames = allGames.filter((g) => !userGameIds.has(g.id));

  const io = request.app.get("io") as Server;

  io.to(sessionId).emit(GAME_LISTING, { myGames, availableGames });
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

    response.redirect(`/readyup/${game.id}`);
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
  const { id, username } = request.session.user!;
  const { game_id } = request.params;
  const gameId = parseInt(game_id);

  await Games.join(gameId, id);

  const io = request.app.get("io") as Server;
  broadcastJoin(io, gameId, id, username);

  response.redirect(`/games/${game_id}`);
});

// start game route
router.post( "/:game_id/start", async (request, response) => {
  try {
  const gameId = parseInt(request.params.game_id);
  const result = await StartGame(gameId);

  const io = request.app.get("io") as Server;
  const topCard = await Cards.getTopCard(gameId);

  broadcastGameStateUpdate(io, gameId, GameState.IN_PROGRESS);
  broadcastGameStart(io, gameId, result.firstPlayerId, { id: topCard!.id, color: topCard!.color, value: topCard!.value });

  const turnInfo = await getCurrentTurn(gameId);
  broadcastTurnChange(io, gameId, turnInfo.currentPlayerId, turnInfo.direction, turnInfo.playerOrder);

  response.redirect(`/games/${gameId}`);
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

    const io = request.app.get("io") as Server;
    const players = await Games.getPlayers(gameId);
    const winner = players.find(p => p.user_id === winnerId);

    broadcastGameEnd(io, gameId, winnerId, winner?.username || 'Unknown');
    broadcastGameStateUpdate(io, gameId, GameState.ENDED);

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
    const { id: userId, username } = request.session.user!;
    const { cardId, chosenColor } = request.body;

    const playerHand = await Cards.getHand(gameId, userId);
    const card = playerHand.find(c => c.id === cardId);

    const result = await playACard(gameId, userId, cardId, chosenColor);

    if (!result.success) {
      return response.status(400).json({ error: result.message });
    }

    const io = request.app.get("io") as Server;

    broadcastCardPlay(io, gameId, userId, username, { id: card!.id, color: chosenColor || card!.color, value: card!.value });

    // Get turn info for special card effects
    const turnInfo = await getCurrentTurn(gameId);

    // Handle special card effects
    if (card!.value === 'skip') {
      const players = await Games.getPlayers(gameId);
      const skipped = players.find(p => p.user_id === turnInfo.currentPlayerId);
      broadcastSkip(io, gameId, turnInfo.currentPlayerId, skipped?.username || 'Unknown');
    }
    if (card!.value === 'reverse') {
      broadcastReverse(io, gameId, turnInfo.direction);
    }
    if ((card!.value === 'wild' || card!.value === 'wild_draw_four') && chosenColor) {
      broadcastColorChosen(io, gameId, userId, username, chosenColor);
    }

    const handCounts = await Cards.getHandCount(gameId);
    broadcastHandUpdate(io, gameId, handCounts);

    if (result.winner) {
      broadcastGameEnd(io, gameId, result.winner, username);
      broadcastGameStateUpdate(io, gameId, GameState.ENDED);
      return response.status(200).json({
        message: result.message,
        winner: result.winner
      });
    }

    broadcastTurnChange(io, gameId, turnInfo.currentPlayerId, turnInfo.direction, turnInfo.playerOrder);

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
    const { id: userId, username } = request.session.user!;
    const { count } = request.body;

    const result = await drawCards(gameId, userId, count || 1);

    const io = request.app.get("io") as Server;
    broadcastDraw(io, gameId, userId, username, count || 1);

    const handCounts = await Cards.getHandCount(gameId);
    broadcastHandUpdate(io, gameId, handCounts);

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

    const io = request.app.get("io") as Server;
    const turnInfo = await getCurrentTurn(gameId);
    broadcastTurnChange(io, gameId, turnInfo.currentPlayerId, turnInfo.direction, turnInfo.playerOrder);

    response.status(200).json({ message: "Turn ended successfully" });
  } catch (error: any) {
    logger.error("Error ending turn:", error);
    response.status(500).json({ error: error.message });
  }
});


export default router;