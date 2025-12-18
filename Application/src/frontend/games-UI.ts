import { HtmlTagDescriptor } from "vite";
import type { DisplayGameCard, User } from "../types/types";



// we are going to need to make sure we use devs that are in our actual ejs file thes are mostly just placeholders for now im not rlly checking


const getCardDisplayValue = (value: string): string => {
    const valueMap: Record<string, string> = {
        'skip': '⊘',
        'reverse': '⟲',
        'draw_two': '+2',
        'wild': '★',
        'wild_draw_four': '+4'
    };
    return valueMap[value] || value;
};

const iscardPlayable = (card: DisplayGameCard, topCard: DisplayGameCard | null): boolean => {

    if (!topCard)  {
        return false;
    }

    if (card.color === "wild") {
        return true;
    }

    if (card.color === topCard.color || card.value === topCard.value) {
        return true;
    }

    return false;

}


// also animations will also be added here
export const renderPlayersHand = async(cards : DisplayGameCard[], topCard : DisplayGameCard | null, myTurn : boolean = false ) => {
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
    playerHandDiv.appendChild(templete); 


    cards.forEach((card) => {
        const clone = templete.cloneNode(true) as HTMLElement;
        clone.style.display = 'block';
        const cards = clone.querySelector('.uno-card');

        if (cards) {
            const playable = myTurn && iscardPlayable(card, topCard);
            const classes = ['uno-card','player-card', `card-${card.color}`];


            if (playable) {
                classes.push('clickable');
            } else {
                classes.push('disabled');
            }

            cards.className = classes.join(' ');

            cards.textContent = getCardDisplayValue(card.value) 

            cards.setAttribute('data-card-id', card.id.toString());


        }

        playerHandDiv.appendChild(clone);

    });

    const cardCountSpan = document.getElementById('playerCardCount');
    if (cardCountSpan) {
        cardCountSpan.textContent = cards.length.toString();
    }
}


export const renderDiscardPile = async (cards : DisplayGameCard[]) => {
    const discardPileDiv = document.getElementById('discardCard');
    if (!discardPileDiv) {
        console.error('Discard pile div not found');
        return;
    }
    if (cards.length === 0) {
        console.error('No cards in discard pile');
        return;
    }
    const topCard = cards[cards.length - 1];
    discardPileDiv.className = `uno-card card-${topCard.color}`;
    discardPileDiv.textContent = getCardDisplayValue(topCard.value) ;
    discardPileDiv.setAttribute('data-card-id', topCard.id.toString());

};



export const renderOtherPlayers = async (players: User[], playerHands: Record<number, number>, currentUserId: string, currentPlayerId: number) => {
    const otherPlayersDiv = document.getElementById('other-players');
    if (!otherPlayersDiv) {
        console.error('Other players div not found');
        return;
    }

    otherPlayersDiv.innerHTML = '';

    // Find current player's position
    const currentPlayer = players.find(p => p.id?.toString() === currentUserId);
    const currentPosition = (currentPlayer as any)?.position || 1;
    const totalPlayers = players.length;

    // Filter out current player and sort by turn order (relative to current player)
    const otherPlayers = players
        .filter(player => player.id?.toString() !== currentUserId)
        .sort((a, b) => {
            const posA = (a as any).position || 0;
            const posB = (b as any).position || 0;

            // Calculate distance from current player in clockwise direction
            // This ensures players are shown in turn order
            const distA = (posA - currentPosition + totalPlayers) % totalPlayers;
            const distB = (posB - currentPosition + totalPlayers) % totalPlayers;

            return distA - distB;
        });

    otherPlayers.forEach(player => {
        if (!player.id) return; // Skip if player id is undefined

        const playerDiv = document.createElement('div');
        playerDiv.className = 'opponent';
        playerDiv.setAttribute('data-player-id', player.id.toString());

        const cardCount = parseInt(playerHands[player.id] as any) || 0;
        console.log(`[renderOtherPlayers] Rendering player ${player.id} (${player.username}): playerHands[${player.id}] = ${playerHands[player.id]}, cardCount = ${cardCount}`);

        const isActive = player.id === currentPlayerId;

        // Show up to 5 card elements, after that just show the count
        const displayCount = Math.min(cardCount, 5);

        const displayName = player.display_name || player.username || `Player ${player.id}`;

        playerDiv.innerHTML = `
            <div class="opponent-info ${isActive ? 'active-player' : ''}">
                <div class="opponent-name">${displayName}</div>
                <div class="opponent-card-count ${isActive ? 'active-turn' : ''}">${cardCount} cards</div>
            </div>
            <div class="opponent-hand">
                ${Array(displayCount).fill('<div class="opponent-card"></div>').join('')}
            </div>
        `;
        otherPlayersDiv.appendChild(playerDiv);
        console.log(`[renderOtherPlayers] Appended opponent div for player ${player.id}`);
    });
};

// the rest of methods that we will need4

export const renderTopCard = async (card: DisplayGameCard) => {
    const discardCard = document.getElementById("discardCard");
    if (!discardCard) {
        console.error("[renderTopCard] #discardCard element not found");
        return;
    }

    // Update value (number / symbol)
    discardCard.textContent = card.value;

    // Ensure we always keep the base class + the correct color class
    // card.color is like "red", "blue", etc., so we need to add "card-" prefix
    const classes = ["uno-card"];
    if (card.color) {
        classes.push(`card-${card.color}`);
    }

    discardCard.className = classes.join(" ");

    // Optional but nice for debugging / future logic
    discardCard.setAttribute("data-card-id", card.id.toString());
};

// Update the turn indicator text (#turnText) to show whose turn it is
export const updateTurnSprite = (
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
export const updateDirectionSprite = (isClockwise: boolean) => {
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
export const updateHandCount = async (count: number) => {
    const playerCardCountSpan = document.getElementById("playerCardCount");
    if (!playerCardCountSpan) {
        console.error("[updateHandCount] #playerCardCount element not found");
        return;
    }

    playerCardCountSpan.textContent = count.toString();

};

// Update the draw pile count display (#drawPileCount)
export const updateDrawPile = async (count: number) => {
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
export const showColorSelectionUI = (): Promise<string> => {
    return new Promise((resolve) => {
        const overlay = document.getElementById("colorPickerOverlay");
        if (!overlay) {
            console.error("Color picker overlay not found");
            // default picks red so the Promise resolves
            resolve("red");
            return;
        }

        // showing the overlay
        overlay.classList.add("active");

        // get all color options elements
        const options = overlay.querySelectorAll<HTMLDivElement>(".color-option");

        const clickHandler = (event: Event) => {
            const target = event.currentTarget as HTMLDivElement;

            let chosenColor: string | null = null;
            if (target.classList.contains("red")) chosenColor = "red";
            else if (target.classList.contains("blue")) chosenColor = "blue";
            else if (target.classList.contains("yellow")) chosenColor = "yellow";
            else if (target.classList.contains("green")) chosenColor = "green";

            if (!chosenColor) {
                return;
            }

            // clean up listeners so they don't stack
            options.forEach(option =>
                option.removeEventListener("click", clickHandler)
            );

            // hide overlay
            overlay.classList.remove("active");

            // resolve the Promise with the color string
            resolve(chosenColor);
        };

        options.forEach(option =>
            option.addEventListener("click", clickHandler)
        );
    });
};

// if we need to close the color picker modal manually
export const hideColorSelectionUI = async () => {
    const overlay = document.getElementById("colorPickerOverlay");
    if (overlay) {
        overlay.classList.remove("active");
    }

};

// Display winner screen when game ends
export const showWinnerScreen = async (winnerName: string, winnerId: number) => {
    console.log("showWinnerScreen fired!", { winnerName, winnerId });

    const overlay = document.getElementById("gameover-overlay");
    if (!overlay) {
        console.error("gameover overlay not found");
        return;
    }

    const titleEl = overlay.querySelector<HTMLElement>("#gameover-title");
    const messageEl = overlay.querySelector<HTMLElement>("#gameover-message");
    const closeBtn = overlay.querySelector<HTMLButtonElement>("#gameover-closeBtn");

    // determine if the current user is the winner
    const currentUserIdStr = document.body.dataset.userId;
    const isYou = currentUserIdStr && parseInt(currentUserIdStr, 10) === winnerId;

    if (titleEl) {
        titleEl.textContent = isYou ? "YOU WIN!" : "GAME OVER!";
    }

    if (messageEl) {
        messageEl.textContent = isYou
            ? "Congratulations, you won the game!"
            : `${winnerName} has won the game.`;
    }

    // show the overlay
    overlay.classList.add("active");

    if (closeBtn) {
        closeBtn.onclick = () => {
            // hide overlay
            overlay.classList.remove("active");
            // redirect to lobby
            window.location.href = "/lobby";
        };
    }
};


// Display game over screen
export const showGameOverScreen = async () => {

};

// Show toast notification for game events ("Skip!", "Reverse!", "Draw 2!", etc.)
export const showGameNotification = async (message: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const container = document.getElementById("notification-container");
    if (!container) {
        console.error("Notification container not found");
        return;
    }

    // create the notification element
    const notif = document.createElement("div");
    notif.className = `notification ${type}`;
    notif.textContent = message;

    container.appendChild(notif);

    // trigger the fade-in animation
    requestAnimationFrame(() => {
        notif.classList.add("show");
    });

    // remove after 3 seconds
    setTimeout(() => {
        notif.classList.remove("show");

        // fade-out before removing
        setTimeout(() => {
            notif.remove();
        }, 300);

    }, 3000);

};


export const updateAllPlayerHandCounts = async (handCounts: Array<{ userId: number; cardCount: number }>, currentUserId: string) => {
    handCounts.forEach(({ userId, cardCount }) => {
        const playerCardCountElement = document.querySelector(`.opponent[data-player-id="${userId}"] .opponent-card-count`);
        if (playerCardCountElement) {
            playerCardCountElement.textContent = `${cardCount} cards`;
        }


        if (userId.toString() === currentUserId) {
            updateHandCount(cardCount);
        }
    });
};




