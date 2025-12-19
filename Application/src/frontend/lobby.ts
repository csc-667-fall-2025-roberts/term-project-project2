import socketIo from "socket.io-client";
import * as EVENTS from "../shared/keys";
import type { Game } from "../types/types";
import { appendGame, loadGames, renderGames } from "./lobby/load-games";

const socket = socketIo();



async function loadRejoinableGames() {
  try {
    const response = await fetch("/lobby/rejoinable-game", {
      credentials: "include"
    });

    if (!response.ok) {
      hideRejoinableGames();
      return;
    }

    const data = await response.json();

    if (data.game) {
      showRejoinableGames(data.game);
    } else {
      hideRejoinableGames();
    }
  } catch (error) {
    console.error("Error fetching rejoinable games:", error);
    hideRejoinableGames();
  }
}


function showRejoinableGames(  games: {id: number, name: string, state: string}) {
  const rejoinableGames = document.querySelector<HTMLDivElement>("#rejoin-game-card");
  const gameName = document.querySelector<HTMLDivElement>("#rejoinGameName");
  const gameMeta = document.querySelector<HTMLDivElement>("#rejoinGameMeta");
  const rejoinGameButton = document.querySelector<HTMLButtonElement>("#rejoinGameButton");

  if (!rejoinableGames || !gameName || !gameMeta || !rejoinGameButton) {
    return;
  }

  gameName.textContent = games.name || `Game ${games.id}`;
  gameMeta.textContent = "In progress";

  const button = rejoinGameButton.cloneNode(true) as HTMLButtonElement;
  rejoinGameButton.parentNode?.replaceChild(button, rejoinGameButton);

  button.addEventListener("click", () => {
    window.location.href = `/games/${games.id}`;
  });

  rejoinableGames.style.display = "flex";
}

function hideRejoinableGames() {
  const rejoinableGames = document.querySelector<HTMLDivElement>("#rejoin-game-card");
  if (rejoinableGames) {
    rejoinableGames.style.display = "none";
  }
}


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
  loadRejoinableGames();
  
});


