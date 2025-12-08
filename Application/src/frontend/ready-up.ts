import socketIO from "socket.io-client";
import * as EVENTS from "../shared/keys";
import type { GamePlayer } from "../types/types";

const gameId = parseInt((document.getElementById("game-id") as HTMLInputElement).value);
const socket = socketIO( {query: { gameId: gameId.toString()}});

let currentUserId: number;
let capacity: number;
let players: GamePlayer[] = [];

const playersList = document.querySelector<HTMLUListElement>("#playersGrid")!;
const readyButton = document.querySelector<HTMLButtonElement>("#readyButton")!;
const readyCountSpan = document.querySelector<HTMLSpanElement>("#readyCount")!;
const totalPlayers = document.querySelector<HTMLSpanElement> ( "#totalPlayers")!;
const progressFill = document.querySelector<HTMLDivElement>("#progressFill")!;

const loadPlayers = async () => {
    const response = await fetch(`/readyup/${gameId}/players`, { method: "get", credentials: "include" });
    const data = await response.json();

    players = data.players;
    currentUserId = data.currentUserId;
    capacity = data.capacity;

    renderedPlayers();
    updateReadyStatus();
};

const renderedPlayers = () => {
        const cards: string[] = [];

        players.forEach((player) => {
            const isCurrentUser = player.user_id === currentUserId;
            const isHost = player.position === 1;
            const name = player.display_name || player.username;
            
            const initials  = name.substring(0,2).toUpperCase();
            cards.push(`
              <div class="player-card ${isHost ? "host" : ""} ${player.is_ready ? "ready" : ""} ${isCurrentUser ? "current-user" : ""}">  
                <div class="player-avatar">
                 <div class="avatar-circle">${isCurrentUser ? "You" : initials} </div>
                 </div>
                 <div class= "player-info">
                     <div class="player-name">${name} ${isHost ? "(Host)" : ""}</div>
                    <div class="player-status">${player.is_ready ? "Ready" : "Waiting.."} </div>
                 </div>   
                 <div class="ready-indicator ${player.is_ready ? "ready" : ""}">
                   ${player.is_ready ? '<span class="checkmark">✓</span>' : '<div class="dot"></div><div class="dot"></div>'}
                 </div>
      </div>
    `);
  });

                                                                                                                             
            
    for (let i = players.length; i < capacity; i++){
        cards.push(`
            <div class="player-card empty">
                <div class="player-avatar">
                    <div class="avatar-circle empty"> ? </div>
                </div>
                <div class="player-info">
                    <div class="player-name">Waiting for Player...</div>
                    <div class="player-status">-</div>
                </div>
            </div>
        `);
    }

    playersList.innerHTML = cards.join("");
};

const updateReadyStatus = () => {
    const readyCount = players.filter((p) => p.is_ready).length;
    const percentage = players.length > 0 ? (readyCount / players.length) * 100 : 0;

    readyCountSpan.textContent = readyCount.toString();
    totalPlayers.textContent = players.length.toString();
    progressFill.style.width = `${percentage}%`;

    const me = players.find((p) => p.user_id === currentUserId);
    if (me) {
        if (me.is_ready) {
            readyButton.classList.add("ready");
            readyButton.querySelector(".btn-text")!.textContent = "Not Ready";
        } else {
            readyButton.classList.remove("ready");
            readyButton.querySelector(".btn-text")!.textContent = "I'm Ready!";
        }
    }
};

socket.on(EVENTS.PLAYER_JOINED, (data: { gameId: number; userId: number; username: string }) => {
    console.log(EVENTS.PLAYER_JOINED, data);

    loadPlayers();
});

socket.on(EVENTS.PLAYER_LEFT, (data: { gameId: number; userId: number; username: string }) => {
    console.log(EVENTS.PLAYER_LEFT, data);

    loadPlayers();
});

socket.on(EVENTS.PLAYER_READY, (data: { gameId: number; userId: number; isReady: boolean }) => {
    console.log(EVENTS.PLAYER_READY, data);

    const player = players.find((p) => p.user_id === data.userId);
    if (player) {
        player.is_ready = data.isReady;
        renderedPlayers();
        updateReadyStatus();
    }
});

socket.on(EVENTS.GAME_START, (data: { gameId: number; starterId: number; topCard: any }) => {
    console.log(EVENTS.GAME_START, data);

    window.location.href = `/games/${gameId}`;
});

const toggleReady = () => {
    fetch(`/readyup/${gameId}/toggle`, {
        method: "post",
        credentials: "include",
    });
};

readyButton.addEventListener("click", (event) => {
    event.preventDefault();

    toggleReady();
});

socket.on("connect", () => {
    console.log("Socket connected, loading players...");
    loadPlayers();
});
