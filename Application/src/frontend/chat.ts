import socketIo from "socket.io-client";
import type { ChatMessage } from "../types/types";
import * as chatKeys from "../shared/keys";

const socket = socketIo();

const listing = document.querySelector<HTMLDivElement>("#message-listing")!;
const input = document.querySelector<HTMLInputElement>("#message-submit input")!;
const button = document.querySelector<HTMLButtonElement>("#message-submit button")!;
const messageTemplate = document.querySelector<HTMLTemplateElement>("#template-chat-message")!;

// Get current user ID from page
const getUserIdFromPage = (): number => {
  const userInfoText = document.querySelector(".user-info")?.textContent || "";
  const match = userInfoText.match(/ID: (\d+)/);
  return match ? parseInt(match[1]) : 0;
};

const currentUserId = getUserIdFromPage();

const appendMessage = ({ username, created_at, message, user_id }: ChatMessage) => {
  const clone = messageTemplate.content.cloneNode(true) as DocumentFragment;
  const messageElement = clone.querySelector(".chat-message") as HTMLElement;

  const timeSpan = clone.querySelector(".message-time");
  const time = new Date(created_at);
  if (isNaN(time.getTime())) {
    timeSpan!.textContent = "Invalid date";
  } else {
    timeSpan!.textContent = time.toLocaleString();
  }
  console.log(time, timeSpan);

  const usernameSpan = clone.querySelector(".message-username");
  const msgSpan = clone.querySelector(".message-text");
  msgSpan!.textContent = message;
  console.log(message, msgSpan);

  // Add class to identify own messages
  if (user_id === currentUserId) {
    messageElement.classList.add("own-message");
    usernameSpan!.textContent = "You";
  } else {
    messageElement.classList.add("other-message");
    usernameSpan!.textContent = username;
  }
  console.log(username, usernameSpan);

  listing.appendChild(clone);
};

socket.on(chatKeys.CHAT_LISTING, ({ messages }: { messages: ChatMessage[] }) => {
  console.log(chatKeys.CHAT_LISTING, { messages });

  messages.forEach((message) => {
    appendMessage(message);
  });
});

socket.on(chatKeys.CHAT_MESSAGE, (message: ChatMessage) => {
  console.log(chatKeys.CHAT_MESSAGE, message);

  appendMessage(message);
});

const sendMessage = () => {
  const message = input.value.trim();

  if (message.length > 0) {
    const body = JSON.stringify({ message });

    fetch("/chat/", {
      method: "post",
      body,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  input.value = "";
};

button.addEventListener("click", (event) => {
  event.preventDefault();

  sendMessage();
});

input.addEventListener("keydown", (event) => {
  if (event.key == "Enter") {
    sendMessage();
  }
});


socket.on("connect", () => {
  console.log("Socket connected, loading messages...");
  fetch("/chat/", {
    method: "get",
    credentials: "include",
  });
});
