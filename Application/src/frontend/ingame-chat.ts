// Followed similar logic to the chat.ts for the lobby page
import socketIo from "socket.io-client";
import type { ChatMessage } from "../types/types";
import * as chatKeys from "../shared/keys";

const gameChatWindow = document.querySelector<HTMLDivElement>("#gameChatWindow");
const gameChatToggle = document.querySelector<HTMLButtonElement>("#gameChatToggle");
const gameChatClose = document.querySelector<HTMLButtonElement>("#gameChatClose");
const gameChatMessages = document.querySelector<HTMLDivElement>("#gameChatMessages");
const gameChatForm = document.querySelector<HTMLFormElement>("#gameChatForm");
const gameChatInput = document.querySelector<HTMLInputElement>("#gameChatInput");

const gameChatSocket = socketIo();

const getUserIdFromPage = (): number => {
  const userInfoText = document.querySelector(".user-info")?.textContent || "";
  const match = userInfoText.match(/ID: (\d+)/);
  return match ? parseInt(match[1]) : 0;
};

const currentUserIdForChat = getUserIdFromPage();

const appendGameChatMessage = ({ username, created_at, message, user_id }: ChatMessage) => {
  if (!gameChatMessages) return;

  const wrapper = document.createElement("div");
  wrapper.classList.add("game-chat-message");

  if (user_id === currentUserIdForChat && currentUserIdForChat !== 0) {
    wrapper.classList.add("own");
  } else {
    wrapper.classList.add("other");
  }

  const header = document.createElement("div");
  header.classList.add("game-chat-message-header");

  const nameSpan = document.createElement("span");
  nameSpan.classList.add("game-chat-username");
  nameSpan.textContent =
    user_id === currentUserIdForChat && currentUserIdForChat !== 0 ? "You" : username;

  const timeSpan = document.createElement("span");
  timeSpan.classList.add("game-chat-time");

  const time = new Date(created_at);
  timeSpan.textContent = isNaN(time.getTime())
    ? ""
    : time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  header.appendChild(nameSpan);
  header.appendChild(timeSpan);

  const textDiv = document.createElement("div");
  textDiv.classList.add("game-chat-text");
  textDiv.textContent = message;

  wrapper.appendChild(header);
  wrapper.appendChild(textDiv);

  gameChatMessages.appendChild(wrapper);
  // scroll to bottom
  gameChatMessages.scrollTop = gameChatMessages.scrollHeight;
};

gameChatSocket.on(chatKeys.CHAT_LISTING, ({ messages }: { messages: ChatMessage[] }) => {
  messages.forEach(appendGameChatMessage);
});

gameChatSocket.on(chatKeys.CHAT_MESSAGE, (message: ChatMessage) => {
  appendGameChatMessage(message);
});

// Send message via the same /chat/ endpoint for now
const sendGameChatMessage = () => {
  if (!gameChatInput) return;

  const text = gameChatInput.value.trim();
  if (!text.length) return;

  const body = JSON.stringify({ message: text });

  fetch("/chat/", {
    method: "post",
    body,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  gameChatInput.value = "";
};

gameChatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  sendGameChatMessage();
});

gameChatInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendGameChatMessage();
  }
});

// Toggle open/close
gameChatToggle?.addEventListener("click", () => {
  if (!gameChatWindow) return;
  gameChatWindow.classList.toggle("hidden");
});

gameChatClose?.addEventListener("click", () => {
  if (!gameChatWindow) return;
  gameChatWindow.classList.add("hidden");
});

gameChatSocket.on("connect", () => {
  fetch("/chat/", {
    method: "get",
    credentials: "include",
  });
});
