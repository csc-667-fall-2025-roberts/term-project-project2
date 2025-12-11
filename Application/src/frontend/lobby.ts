import socketIo from "socket.io-client";
import * as EVENTS from "../shared/keys";
import type { Game } from "../types/types";
import { appendGame, loadGames, renderGames } from "./lobby/load-games";

const socket = socketIo();

socket.on(EVENTS.GAME_LISTING, (data: { myGames: Game[], availableGames: Game[] } | Game[]) => {
  console.log(EVENTS.GAME_LISTING, data);

  // Handle both old array format and new object format
  if (Array.isArray(data)) {
    renderGames(data);
  } else {
    // Combine myGames and availableGames, or just show availableGames
    renderGames([...data.myGames, ...data.availableGames]);
  }
});

socket.on(EVENTS.GAME_CREATE, (game: Game) => {
  console.log(EVENTS.GAME_CREATE, game);

  appendGame(game);
});

// Wait for socket connection before loading games to avoid race condition
socket.on("connect", () => {
  console.log("Socket connected, loading games...");
  loadGames();
});
