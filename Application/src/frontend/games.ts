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

socket.on(GAME_STATE_UPDATE, (data: { gameId: number; state: string }) => {
    console.log("Game state updated:", data);
  
});


socket.on(TURN_CHANGE, (turnData: { currentPlayerId: number, turnDirection: number, player_order: number, gameId: number }) => {
    console.log("Turn changed:", turnData);
    currentPlayerId = turnData.currentPlayerId;
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


socket.on(CARD_DEAL, (data: { gameId: number; cards: DisplayGameCard[] }) => { 
    console.log("Cards dealt:", data);
    if (data.gameId.toString() !== gameId) {
        console.error("invalid game ID" ); 
        return;
    }

    myhand = data.cards;
    renderPlayersHand(myhand,topDiscardCard, myTurn);

    
} );

socket.on(CARD_DRAW_COMPLETED, async (data: { gameId: number; userId: number; username: string; count: number}) => {
    console.log("Card drawn:", data);
    const isCurrentUser = data.userId.toString() === currentUserId;
    updateDrawPile(data.count);

    if (isCurrentUser) {
        const response = await fetch(`/games/${gameId}/player_hand`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
        }
        });
        const playerHand = await response.json();
        myhand = playerHand.hand;
        renderPlayersHand(myhand,topDiscardCard, myTurn);
    }
        
});

socket.on(SKIP, (data: { gameId: number; skippedPlayerId: number; skippedUsername: string }) => {
    console.log("Turn skipped:", data);

    const currentPlayer = players.find(p => p.id === data.skippedPlayerId);
    const playerName = currentPlayer ? currentPlayer.username : data.skippedUsername;

    if(data.skippedPlayerId.toString() == currentUserId){
        showGameNotification(`Your turn was skipped`, 'info');
        return;
    }else{
        showGameNotification(`${playerName}'s turn was skipped`, 'info');
    }
   
    
    


});

socket.on(REVERSE, (data: { gameId: number; newDirection: number;}) => {
    console.log("Reverse:", data);
    isClockwise = data.newDirection === 1;
    updateDirectionSprite(isClockwise);
    showGameNotification("Game direction reversed!", 'info');

});



socket.on(COLOR_CHOSEN, (data: { gameId: number; userId: number; username: string; chosenColor: string} ) => {
   console.log("Color chosen:", data);
   console.log(`${data.username} chose ${data.chosenColor}`, 'info');
   if(topDiscardCard) {
         topDiscardCard.color = data.chosenColor;
         renderDiscardPile([topDiscardCard]);
   }
});

socket.on(GAME_END, (data: { gameId: number; winnerId: number; winnerUsername: string }) => {
    console.log("Game ended:", data);

    showWinnerScreen(data.winnerUsername, data.winnerId);

});

socket.on(ERROR, (data: { gameId: number; error: string; userId?: number }) => {
    console.error("Game error:", data);
    showGameNotification(`Error: ${data.error}`, 'warning');

});



// Game action functions

const initGame = async () => {
    console.log("Initializing game...", { gameId, currentUserId });

    const turnResponse = await fetch(`/games/${gameId}/turn`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    const turnData = await turnResponse.json();
    currentPlayerId = turnData.currentPlayerId;
    isClockwise = turnData.direction === 1;
    myTurn = currentPlayerId === parseInt(currentUserId);

    const response = await fetch(`/games/${gameId}/players`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    const playersData = await response.json();
    players = playersData.players;
    
    const discard = await fetch(`/games/${gameId}/discard_pile`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const discardData = await discard.json();
    if (discardData.discardPile.length > 0) {
        const displayCard = discardData.discardPile[discardData.discardPile.length - 1];
        topDiscardCard = displayCard;
        renderDiscardPile([displayCard]);
    }
    else {
        topDiscardCard = null;
        renderDiscardPile([]);
    }

    const handResponse = await fetch(`/games/${gameId}/player_hand`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    const playerHand = await handResponse.json();
    myhand = playerHand.hand;
    renderPlayersHand(myhand,topDiscardCard, myTurn);
    updateHandCount(myhand.length);

    const hCResponse = await fetch(`/games/${gameId}/hand_counts`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    const handCountsData = await hCResponse.json();
    const handCounts = Object.fromEntries(
        handCountsData.handCounts.map((hc: { userId: number; cardCount: number }) => [hc.userId, hc.cardCount])
    );


    

    renderOtherPlayers(players,handCounts, currentUserId, currentPlayerId);
    updateTurnSprite(currentPlayerId, players.find(p => p.id === currentPlayerId) ?.username || '', myTurn);
    updateDirectionSprite(isClockwise);
    updateDrawPile(108 - myhand.length); 
    
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
        const response = await fetch(`/games/${gameId}/play`, {
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
        renderPlayersHand(myhand, topDiscardCard, myTurn);

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
