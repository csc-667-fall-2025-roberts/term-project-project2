import type { DisplayGameCard, User  } from "../types/types";



// we are going to need to make sure we use devs that are in our actual ejs file thes are mostly just placeholders for now im not rlly checking

// Helper function to convert card values to display symbols
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

// also animations will also be added here
export const renderPlayersHand = async(cards : DisplayGameCard[]) => {
    const playerHandDiv = document.getElementById(`playerCards`);
    if (!playerHandDiv) {
        console.error('playerCards div not found');
        return;
    }

    const templete = playerHandDiv.querySelector('.player-card-wrapper');
    if (!templete) {
        console.error('Player card template not found');
        return;
    }

    playerHandDiv.innerHTML = '';
    playerHandDiv.appendChild(templete); // Keep template hidden

    cards.forEach((card) => {
        const clone = templete.cloneNode(true) as HTMLElement;
        clone.style.display = 'block'; // Make the cloned wrapper visible
        const cardElement = clone.querySelector('.uno-card');

        if (cardElement) {
            cardElement.className = `uno-card player-card card-${card.color} clickable`;
            cardElement.textContent = getCardDisplayValue(card.value);
            cardElement.setAttribute('data-card-id', card.id.toString());
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
        console.error('Discarddiv not found');
        return;
    }
    if (cards.length === 0) {
        console.error('No cards in discard pile');
        return;
    }
    const topCard = cards[cards.length - 1];
    discardPileDiv.className = `uno-card card-${topCard.color}`;
    discardPileDiv.textContent = getCardDisplayValue(topCard.value);
    discardPileDiv.setAttribute('data-card-id', topCard.id.toString());
};


export const renderOtherPlayers = async(players: User[], playerHands: Record<number, number>, currentUserId: string, currentPlayerId: number) => {
    const otherPlayersDiv = document.getElementById('opponentsArea');
    if (!otherPlayersDiv) {
        console.error('Opponentsdiv not found');
        return;
    }

    otherPlayersDiv.innerHTML = '';

    // filter current player
    const otherPlayers = players.filter(player => player.id?.toString() !== currentUserId);

    otherPlayers.forEach(player => {
        if (!player.id) return; // Skip if player id is undefined

        const opponentDiv = document.createElement('div');
        opponentDiv.className = 'opponent';
        opponentDiv.setAttribute('data-player-id', player.id.toString());

        const cardCount = parseInt(playerHands[player.id] as any) || 0;
        const isActive = player.id === currentPlayerId;

        opponentDiv.innerHTML = `
            <div class="opponent-info ${isActive ? 'active-player' : ''}">
                <div class="opponent-name">${player.username}</div>
                <div class="opponent-card-count ${isActive ? 'active-turn' : ''}">${cardCount} cards</div>
            </div>
            <div class="opponent-hand">
                ${Array(cardCount).fill('<div class="opponent-card"></div>').join('')}
            </div>
        `;
        otherPlayersDiv.appendChild(opponentDiv);
    });
};

// the rest of methods that we will need4

export const renderTopCard = async(card: DisplayGameCard) => {
    
};

// Update the turn indicator text (#turnText) to show whose turn it is
export const updateTurnSprite = async(currentPlayerId: number, playerName: string, isYourTurn: boolean) => {
  

};

// Update the direction arrow (#directionArrow) to show game direction
export const updateDirectionSprite = async(isClockwise: boolean) => {

};

// Update the player's card count display (#playerCardCount)
export const updateHandCount = async(count: number) => {

};

// Update the draw pile count display (#drawPileCount)
export const updateDrawPile = async(count: number) => {

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


// Show toast notification for game events ("Skip!", "Reverse!", "Draw 2!", etc.)
export const showGameNotification = async(message: string, type: 'info' | 'warning' | 'success' = 'info') => {

};


export const updateAllPlayerHandCounts = async(handCounts: Array<{ userId: number; cardCount: number }>, currentUserId: string) => {
    handCounts.forEach(({ userId, cardCount }) => {
        if (!userId) return; // Skip if userId is undefined

        const playerCardCountElement = document.querySelector(`.other-player[data-player-id="${userId}"] .player-card-count`);
        if (playerCardCountElement) {
            playerCardCountElement.textContent = `Cards: ${cardCount}`;
        }


        if (userId.toString() === currentUserId) {
            updateHandCount(cardCount);
        }


    });
};






