import type { DisplayGameCard, User  } from "../types/types";



// we are going to need to make sure we use devs that are in our actual ejs file thes are mostly just placeholders for now im not rlly checking



// also animations will also be added here
export const renderPlayersHand = async(cards : DisplayGameCard[]) => {
    const playerHandDiv = document.getElementById(`playerCards`);
    if (!playerHandDiv) {
        console.error(`Player hand div not found`);
        return;
    }

    const templete = playerHandDiv.querySelector('.player-card-wrapper');
    if (!templete) {
        console.error(`Player card template not found`);
        return;
    }

    playerHandDiv.innerHTML = '';

    cards.forEach(card => {
        const clone = templete.cloneNode(true) as HTMLElement;
        const cards = clone.querySelector('.uno-card');

        if (cards) {
            cards.className = `uno-card ${card.color} clickable`;

            cards.textContent = card.value;

            cards.setAttribute('data-card-id', card.id.toString());


        }

        playerHandDiv.appendChild(clone);
      
    });

    const cardCountSpan = document.getElementById('playercCardCount');
    if (cardCountSpan) {
        cardCountSpan.textContent = cards.length.toString();
    }
}


export const renderDiscardPile = async (cards : DisplayGameCard[]) => {
    const discardPileDiv = document.getElementById('game-discard');
    if (!discardPileDiv) {
        console.error('Discard pile div not found');
        return;
    }
    discardPileDiv.innerHTML = '';
    if (cards.length === 0) {
        console.error('No cards in discard pile');
        return;
    }
    const topCard = cards[cards.length - 1];
    const cardDiv = document.createElement('div');
    cardDiv.className = `uno-card ${topCard.color}`;
    cardDiv.textContent = topCard.value;
    cardDiv.setAttribute('data-card-id', topCard.id.toString());
    discardPileDiv.appendChild(cardDiv);

};


export const renderOtherPlayers = async(players: User[], playerHands: Record<number, number>, currentUserId: string, currentPlayerId: number) => {
    const otherPlayersDiv = document.getElementById('other-players');
    if (!otherPlayersDiv) {
        console.error('Other players div not found');
        return;
    }

    otherPlayersDiv.innerHTML = '';

    // filter current player
    const otherPlayers = players.filter(player => player.id.toString() !== currentUserId);


    otherPlayers.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'other-player';
        playerDiv.innerHTML = `
            <div class="player-avatar">
                <div class="player-name">${player.username}</div>
                <div class="player-card-count">Cards: ${playerHands[player.id] || 0}</div>
                <div class="player-turn-indicator ${player.id === currentPlayerId ? 'active' : ''}"></div>
                <div class="player-position">Position: ${player.id}</div>
            </div>
        `;
        otherPlayersDiv.appendChild(playerDiv);
    });
};

// the rest of methods that we will need4

export const renderTopCard = async(card: DisplayGameCard) => {
        const discardCard = document.getElementById("discardCard");
    if (!discardCard) {
        console.error("[renderTopCard] #discardCard element not found");
        return;
    }

    // Update value (number / symbol)
    discardCard.textContent = card.value;

    // Ensure we always keep the base class + the correct color class
    // card.color is expected to be like "card-red", "card-blue", etc.
    const classes = ["uno-card"];
    if (card.color) {
        classes.push(card.color);
    }

    discardCard.className = classes.join(" ");

    // Optional but nice for debugging / future logic
    discardCard.setAttribute("data-card-id", card.id.toString());
};

// Update the turn indicator text (#turnText) to show whose turn it is
export const updateTurnSprite = async(
    currentPlayerId: number, 
    playerName: string, 
    isYourTurn: boolean
) => {
        const turnText = document.getElementById("turnText");
    if (!turnText) {
        console.error("[updateTurnSprite] #turnText element not found");
        return;
    }

    // Track whose turn for debugging / potential styling
    turnText.setAttribute("data-current-player-id", currentPlayerId.toString());

    if (isYourTurn) {
        turnText.textContent = "Your Turn";
        turnText.classList.add("your-turn");
    } else {
        turnText.textContent = `${playerName}'s Turn`;
        turnText.classList.remove("your-turn");
    }
};

// Update the direction arrow (#directionArrow) to show game direction
export const updateDirectionSprite = async(isClockwise: boolean) => {
        const directionArrow = document.getElementById("directionArrow");
    const directionText = document.getElementById("directionText");

    if (!directionArrow || !directionText) {
        console.error("[updateDirectionSprite] direction UI elements not found");
        return;
    }

    // Same behavior as the inline updateDirectionUI:
    if (isClockwise) {
        directionArrow.classList.remove("reverse"); // CSS flips when .reverse is present
        directionText.textContent = "Clockwise";
    } else {
        directionArrow.classList.add("reverse");
        directionText.textContent = "Counterclockwise";
    }

    // Optional: data attribute for debugging / CSS
    directionArrow.setAttribute(
        "data-direction",
        isClockwise ? "clockwise" : "counterclockwise"
    );

};

// Update the player's card count display (#playerCardCount)
export const updateHandCount = async(count: number) => {
        const playerCardCountSpan = document.getElementById("playerCardCount");
    if (!playerCardCountSpan) {
        console.error("[updateHandCount] #playerCardCount element not found");
        return;
    }

    playerCardCountSpan.textContent = count.toString();

};

// Update the draw pile count display (#drawPileCount)
export const updateDrawPile = async(count: number) => {
        const drawPileCountSpan = document.getElementById("drawPileCount");
    if (!drawPileCountSpan) {
        console.error("[updateDrawPile] #drawPileCount element not found");
        return;
    }

    drawPileCountSpan.textContent = count.toString();

    // Optional: visual state when empty
    if (count === 0) {
        drawPileCountSpan.classList.add("empty-draw-pile");
    } else {
        drawPileCountSpan.classList.remove("empty-draw-pile");
    }
};

// Show the color picker modal (#colorPickerOverlay) for Wild cards
export const showColorSelectionUI = async() => {

};

// Hide the color picker modal (#colorPickerOverlay)
export const hideColorSelectionUI = async() => {

};

// Display winner screen when game ends
export const showWinnerScreen = async(winnerName: string, winnerId: number) => {

};

// Display game over screen
export const showGameOverScreen = async() => {

};

// Show toast notification for game events ("Skip!", "Reverse!", "Draw 2!", etc.)
export const showGameNotification = async(message: string, type: 'info' | 'warning' | 'success' = 'info') => {

};


export const updateAllPlayerHandCounts = async(handCounts: Array<{ userId: number; cardCount: number }>, currentUserId: string) => {
    handCounts.forEach(({ userId, cardCount }) => {
        const playerCardCountElement = document.querySelector(`.other-player[data-player-id="${userId}"] .player-card-count`);
        if (playerCardCountElement) {
            playerCardCountElement.textContent = `Cards: ${cardCount}`;
        }

 
        if (userId.toString() === currentUserId) {
            updateHandCount(cardCount);
        }
    });
};

declare global {
  interface Window {
    renderTopCard?: typeof renderTopCard;
    updateTurnSprite?: typeof updateTurnSprite;
    updateDirectionSprite?: typeof updateDirectionSprite;
    updateHandCount?: typeof updateHandCount;
    updateDrawPile?: typeof updateDrawPile;
  }
}

if (typeof window !== "undefined") {
  window.renderTopCard = renderTopCard;
  window.updateTurnSprite = updateTurnSprite;
  window.updateDirectionSprite = updateDirectionSprite;
  window.updateHandCount = updateHandCount;
  window.updateDrawPile = updateDrawPile;
}



