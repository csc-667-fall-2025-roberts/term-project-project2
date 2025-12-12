import socketIo from "socket.io-client";
import {
    GAME_STATE_UPDATE,
    CARD_PLAY,
    CARD_DRAW_COMPLETED,
    COLOR_CHOSEN,
    TURN_CHANGE,
    GAME_END,
    REVERSE,
    SKIP,
    ERROR,
    PLAYER_HAND_UPDATE,
    CARD_DEAL
} from "../shared/keys";

// Import UI rendering functions
import {
    renderPlayersHand,
    renderDiscardPile,
    renderOtherPlayers,
    updateTurnSprite,
    updateDirectionSprite,
    updateHandCount,
    updateDrawPile,
    showColorSelectionUI,
    hideColorSelectionUI,
    showWinnerScreen,
    showGameNotification,
    updateAllPlayerHandCounts
} from './games-UI';

import type { DisplayGameCard, User } from "../types/types";

// Socket setup

const gameId = document.body.dataset.gameId! || "";
const currentUserId = document.body.dataset.userId! || "0";
const socket = socketIo({ query: { gameId } });

// Game state
let myTurn = false;
let players: User[] = [];
let currentPlayerId: number = 0;
let isClockwise: boolean = true;
let myhand: DisplayGameCard[] = [];
let topDiscardCard: DisplayGameCard | null = null; 


// Socket Event Listeners

socket.on(GAME_STATE_UPDATE, (gameState: {
    playerHands: Record<number, DisplayGameCard[]>;
    currentPlayer: number;
    players: User[];
    topDiscardCard: DisplayGameCard[];
}) => {
    console.log("Received game state update:", gameState);


    players = gameState.players;
    currentPlayerId = gameState.currentPlayer;
    myTurn = currentPlayerId === parseInt(currentUserId);

    // get the top discard card and render it into the "game-discard" div
    const discardDiv = document.getElementById("game-discard");

    if (discardDiv) {
        topDiscardCard = gameState.topDiscardCard[gameState.topDiscardCard.length - 1];
        discardDiv.innerHTML = `
            <div class="playing-card" data-card-id="${topDiscardCard.id}">
                <div class="card-color">${topDiscardCard.color}</div>
                <div class="card-value">${topDiscardCard.value}</div>
            </div>
        `;

    } else {
        console.error("Discard div not found");
    }

    // get the count of player cards and render the correct number of "playing-card-back" divs
    gameState.players.forEach(player => {
        const playerHandDiv = document.getElementById(`player-hand-${player.id}`);
        if (playerHandDiv) {
            const hand = gameState.playerHands[player.id] || [];
            playerHandDiv.innerHTML = hand.map(() => `<div class="playing-card-back"></div>`).join("");
        } else {
            console.error(`Player hand not found for: ${player.id}`);
        }
    });
});






socket.on(TURN_CHANGE, (turnData: { currentPlayer: number, turnDirection: number, player_order: number, gameId: number }) => {
    console.log("Turn changed:", turnData);
    currentPlayerId = turnData.currentPlayer;
    isClockwise = turnData.turnDirection === 1;
    myTurn = currentPlayerId === parseInt(currentUserId);

 
    const currentPlayer = players.find(p => p.id === currentPlayerId);
    const playerName = currentPlayer ? currentPlayer.username : `Player ${currentPlayerId}`;

    updateTurnSprite(currentPlayerId, playerName, myTurn);

    updateDirectionSprite(isClockwise);

    if (myTurn) {
        showGameNotification("It's your turn!", 'info');
    } else {
        showGameNotification(`${playerName}'s turn`, 'info');
    }
});


socket.on(CARD_PLAY, (data: { gameId: number; userId: number; username: string; card: DisplayGameCard }) => {
    console.log("Card played:", data);
    topDiscardCard = data.card;
    renderDiscardPile([data.card]);
});


socket.on( PLAYER_HAND_UPDATE, (data: { gameId: number; handCounts: Array<{ userId: number; cardCount: number }> } ) => {
    console.log("Player hand updated:", data);
    updateAllPlayerHandCounts(data.handCounts, currentUserId);
});


socket.on(CARD_DEAL, (data: {}) => { 
    
} );

socket.on(CARD_DRAW_COMPLETED, (data: any) => {
    console.log("Card drawn:", data);
});

socket.on(SKIP, (data: { gameId: number; userId: number; username: string , skippedUserId: number}) => {
    console.log("Turn skipped:", data);
    
    

});

socket.on(REVERSE, (data: any) => {
    console.log("Reverse:", data);
});



socket.on(COLOR_CHOSEN, (data: { gameId: number; userId: number; username: string; chosenColor: string} ) => {
   
});

socket.on(GAME_END, (data: any) => {
    console.log("Game ended:", data);
});

socket.on(ERROR, (error: any) => {
    console.error("Game error:", error);
});



// Game action functions

const initGame = async () => {
    console.log("Initializing game...", { gameId, currentUserId });

   
}

const updateTurn = async () => {
    const turnData = await getCurrentTurn();

    if (!turnData) {
        return;
    }

    currentPlayerId = turnData.currentPlayerId;
    isClockwise = turnData.direction === 1;
    myTurn = currentPlayerId === parseInt(currentUserId);

    const currentPlayer = players.find(p => p.id === currentPlayerId);
    const playerName = currentPlayer ? currentPlayer.username : `Player ${currentPlayerId}`;

    updateTurnSprite(currentPlayerId, playerName, myTurn);
    updateDirectionSprite(isClockwise);

    if (myTurn) {
        showGameNotification("It's your turn!", 'info');
    } else {
        showGameNotification(`${playerName}'s turn`, 'info');
    }
}

const cardIsPlayable = (card: DisplayGameCard, topCard: DisplayGameCard): boolean => {

    if (!topCard || !myTurn)  {
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




const playSelectedCard = async (selectedCardId: number) => {
    if (!myTurn) {
        console.log(" not your turn!");
        return;
    }

    const selectedCard = myhand.find(c => c.id === selectedCardId);
    if (!selectedCard) {
        console.log("Card is not in your hand.");
        return;
    }

    if (!cardIsPlayable(selectedCard, topDiscardCard!)) {
        console.log("You may not play that card");
    }

   
    // If it's a wild card, show color selection UI
    if (selectedCard.color === "wild") {
        await colorSelection(selectedCardId);
    } else {
        // Play the card directly
        await playCard(selectedCardId);
    }
}

const colorSelection = async (selectedCardId: number) => {
    const chosenColor = await showColorSelectionUI();
    //await playCard(selectedCardId, chosenColor);
}

const endTurn = async () => {
   try {
        const response = await fetch(`/games/${gameId}/end-turn`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            console.error("Failed to end turn");
            myTurn = true;
            return;
        }

       myTurn = false;
    } catch (error) {
        console.error("Error ending turn:", error);
   }

};


const skipTurn = async ( currentPlayerId: number) => {
    try {
        const response = await fetch(`/games/${gameId}/skip`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
    }
    catch (error) {
        console.error("Error skipping turn:", error);
    }
    await endTurn();




}

// api calls
const drawCard = async (count: number = 1) => {
    try {
        const response = await fetch(`/games/${gameId}/draw`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ count }),
            credentials: "include",
        });

        if (!response.ok) {
            console.error("Failed to draw card");


        }
        const result = await response.json();

        // Auto-end turn after drawing
        await endTurn();

        return result;
        


    } catch (error) {
        console.error("Error drawing card", error);


    }

}

const playCard = async (cardId: number, chosenColor?: string) => {
    try {
        const response = await fetch(`/games/${gameId}/play-card`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ cardId, chosenColor }),
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json();
            showGameNotification(`error playing card ${errorData.message}`, 'warning');
            return;
        }

    
        myhand = myhand.filter(c => c.id !== cardId);
        renderPlayersHand(myhand);

        await endTurn();

        const result = await response.json();
        return result;
      
    } catch (error) {
        console.error("Error playing card:", error);

        
    }
}



const getCurrentTurn = async () => {
    try {
        const response = await fetch(`/games/${gameId}/turn`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            console.error("failed to fetch turn");
            return null;
        }

        const turnData = await response.json();
        console.log("Current turn:", turnData);

        return turnData;
    } catch (error) {
        console.error("Error getting turnnfo i:", error);
        return null;
    }
}




// UI Rendering Functions
initGame();
