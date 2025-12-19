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
import { constants } from "fs/promises";

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

    let maxPlayers = max_players ? parseInt(max_players) : 4;

    // Enforce maximum of 4 players
    if (maxPlayers > 4) {
      maxPlayers = 4;
    }

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

    const actualTopCard = await Cards.getTopCard(gameId);

    const cardToBroadcast = actualTopCard || { id: card!.id, color: chosenColor || card!.color, value: card!.value };

    logger.info(`[play route] Broadcasting card: ${cardToBroadcast.color} ${cardToBroadcast.value}`);


    broadcastCardPlay(io, gameId, userId, username,cardToBroadcast); 

    // Get turn info for special card effects
    const turnInfo = await getCurrentTurn(gameId);

    const players = await Games.getPlayers(gameId);

    // Handle special card effects
    if (card!.value === 'skip') {
      // The skipped player is one position back from current player
      const sortedPlayers = players.sort((a, b) => a.position - b.position);
      
      const currentPlayerIndex = sortedPlayers.findIndex(p => p.user_id === turnInfo.currentPlayerId);
      
      
      const skippedPlayerIndex = turnInfo.direction === 1
        ? (currentPlayerIndex - 1 + sortedPlayers.length) % sortedPlayers.length
        : (currentPlayerIndex + 1) % sortedPlayers.length;

      const skipped = sortedPlayers[skippedPlayerIndex];
      broadcastSkip(io, gameId, skipped.user_id, skipped.username);
    }
    if (card!.value === 'reverse') {
      broadcastReverse(io, gameId, turnInfo.direction);
    }
    if (card!.value === 'draw_two' || card!.value === 'wild_draw_four') {
      const drawCount = card!.value === 'draw_two' ? 2 : 4;
      const nextPlayerId = players.find(p => p.user_id === turnInfo.currentPlayerId);
      broadcastDraw(io, gameId, turnInfo.currentPlayerId, nextPlayerId?.username || 'Unknown', drawCount);
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

    // End turn after drawing
    await endTurn(gameId, userId);
    const turnInfo = await getCurrentTurn(gameId);
    broadcastTurnChange(io, gameId, turnInfo.currentPlayerId, turnInfo.direction, turnInfo.playerOrder);

    response.status(200).json({
      message: "Cards were drawn successfully",
      cardIds: result.cardIds
    });
  } catch (error: any) {
    logger.error("Error drawing your cards:", error);
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

    response.status(200).json({ message: "Turn ended" });
  } catch (error: any) {
    logger.error("Error ending turn:", error);
    response.status(500).json({ error: error.message });
  }
});

router.get("/:game_id/player_hand", async (request, response) => {
  const gameId = parseInt(request.params.game_id);
  const { id: userId } = request.session.user!;
  const card_data = await Cards.getHand(gameId, userId);
  const myCards = card_data.map((c) => ({ id: c.id, color: c.color, value: c.value}));
  response.status(200).json({ hand: myCards });
});

router.get("/:game_id/players", async (request, response) => {
  try {
    const gameId = parseInt(request.params.game_id);
    const players = await Games.getPlayers(gameId);
    const handCounts = await Cards.getHandCount(gameId);

    const formattedPlayers = players.map(p => {
      const handCount = handCounts.find(hc => hc.owner_id === p.user_id);
      return {
        id: p.user_id,
        username: p.username,
        display_name: p.display_name,
        position: p.position,
        isReady: p.is_ready,
        cardCount: handCount ? handCount.hand_count : 0
      };
    });

    response.status(200).json({ players: formattedPlayers });
  } catch (error: any) {
    logger.error("Error getting players:", error);
    response.status(500).json({ error: error.message });
  }
});

router.get("/:game_id/discard_pile", async (request, response) => {
  try {
    const gameId = parseInt(request.params.game_id);
    const topCard = await Cards.getTopCard(gameId);
    const discardPile = topCard ? [topCard] : [];

    response.status(200).json({ discardPile });
  } catch (error: any) {
    logger.error("Error getting discard pile:", error);
    response.status(500).json({ error: error.message });
  }
});





export default router;