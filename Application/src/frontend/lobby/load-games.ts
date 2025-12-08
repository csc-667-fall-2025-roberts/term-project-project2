import { Game } from "../../types/types";

const gameListing = document.querySelector<HTMLDivElement>("#game-list")!;
const gameItemTemplate = document.querySelector<HTMLTemplateElement>("#game-listing-template")!;

export const loadGames = () => {
  fetch("/games", { credentials: "include" });
};

const createGameElement = (game: Game) => {
  const gameItem = gameItemTemplate.content.cloneNode(true) as HTMLDivElement;

  gameItem.querySelector(".game-id")!.textContent = `${game.id}`;
  gameItem.querySelector(".game-name")!.textContent = game.name ?? `Game ${game.id}`;
  gameItem.querySelector(".game-created-by")!.textContent = game.host_username || `User ${game.host_id}`;
  gameItem.querySelector(".game-state")!.textContent = game.state;
  gameItem.querySelector(".max-players")!.textContent = `${game.player_count || 0}/${game.capacity}`;
  gameItem.querySelector(".created-at")!.textContent = new Date(
    game.created_at,
  ).toLocaleDateString();

  const goToGameBtn = gameItem.querySelector(".goto-game-btn") as HTMLAnchorElement;
  goToGameBtn.href = `/readyup/${game.id}`;

  return gameItem;
};

export const renderGames = (games: Game[]) => {
  gameListing.replaceChildren(...games.map(createGameElement));
};

export const appendGame = (game: Game) => {
  gameListing.appendChild(createGameElement(game));
};
