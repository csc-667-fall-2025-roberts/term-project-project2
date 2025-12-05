// deck and card sql queries.


// create shuffled deck for a game
export const CREATE_DECK = `
INSERT INTO cards (game_id, deck_card_id, owner_id, location)
SELECT $1, id, 0, ROW_NUMBER() OVER (ORDER BY RANDOM())
FROM deck_cards;
`;

// get a certain number of cards from the deck.

export const DRAW_CARDS = `
UPDATE cards
SET owner_id = $2
WHERE id IN (
  SELECT id
  FROM cards
  Where game_id = $1 AND owner_id = 0 AND location > 0
    ORDER BY location
    LIMIT $3
)
RETURNING id;

`;

// get player hand with card details 
export const GET_HAND = `
SELECT c.id, dc.color, dc.value
FROM cards c 
JOIN deck_cards dc ON c.deck_card_id = dc.id
Where c.game_id = $1 AND c.owner_id = $2
ORDER BY c.location 
`;

// play a card (remove from hand)
export const PLAY_CARD = `
UPDATE cards
SET owner_id = 0, location = -1
Where id = $1 AND game_id = $2 AND owner_id = $3
RETURNING *;
`;


// see whats on top of discard pile 

export const GET_TOP_Card  = `
SELECT c.id, dc.color, dc.value
    FROM cards c
    JOIN deck_cards dc ON c.deck_card_id = dc.id
    WHERE c.game_id = $1 AND c.location = -1
    ORDER BY c.id DESC
    LIMIT 1;
`;




// get hand_count
export const GET_HAND_COUNT = `
SELECT owner_id, COUNT(*) as hand_count
FROM cards
WHERE game_id = $1 AND owner_id != 0
GROUP BY owner_id;
`;

// get deck count 

export const GET_DECK_COUNT = `
SELECT COUNT(*) as deck_count
FROM cards 
WHERE game_id = $1 AND owner_id = 0 AND location > 0;
`;