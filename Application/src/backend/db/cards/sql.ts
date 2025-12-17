// deck and card sql queries.


// create deck 
export const CREATE_DECK = `
WITH full_deck AS (
  
  SELECT id
  FROM deck_cards
  WHERE value = '0' AND color != 'wild'

  UNION ALL

  -- 1-9 (two per color)
  SELECT dc.id
  FROM deck_cards dc
  JOIN generate_series(1,2) gs ON true
  WHERE dc.value IN ('1','2','3','4','5','6','7','8','9')
    AND dc.color != 'wild'

  UNION ALL


  SELECT dc.id
  FROM deck_cards dc
  JOIN generate_series(1,2) gs ON true
  WHERE dc.value IN ('skip','reverse','draw_two')
    AND dc.color != 'wild'

  UNION ALL

  -- wild (4 copies)
  SELECT dc.id
  FROM deck_cards dc
  JOIN generate_series(1,4) gs ON true
  WHERE dc.value = 'wild' AND dc.color = 'wild'

  UNION ALL


  SELECT dc.id
  FROM deck_cards dc
  JOIN generate_series(1,4) gs ON true
  WHERE dc.value = 'wild_draw_four' AND dc.color = 'wild'
)
INSERT INTO cards (game_id, deck_card_id, owner_id, location)
SELECT $1, id, 0, ROW_NUMBER() OVER (ORDER BY RANDOM())
FROM full_deck;
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

export const DEAL_CARDS = `
UPDATE cards SET owner_id = $1
WHERE id = ANY($2) AND game_id = $3;
`; 

export const TOP_CARDS = `
SELECT c.id, dc.color, dc.value, c.location, c.owner_id
FROM cards c
JOIN deck_cards dc ON c.deck_card_id = dc.id
WHERE c.game_id = $1 AND c.owner_id = 0 AND c.location > 0
ORDER BY c.location
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
WITH latest_move AS (
    SELECT card_id, chosen_color
    FROM moves
    WHERE game_id = $1 AND card_id IS NOT NULL
    ORDER BY id DESC
    LIMIT 1
)
SELECT c.id,
       COALESCE(m.chosen_color, dc.color) as color,
       dc.value
    FROM cards c
    JOIN deck_cards dc ON c.deck_card_id = dc.id
    JOIN latest_move m ON m.card_id = c.id
    WHERE c.game_id = $1;
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

export const Recycle_Discard_into_Draw_Deck = `
WITH top_discard AS (
  SELECT m.card_id
  FROM moves m
  WHERE m.game_id = $1
    AND m.card_id IS NOT NULL
  ORDER BY m.id DESC
  LIMIT 1
),
to_recycle AS (
  SELECT c.id AS card_id
  FROM cards c
  WHERE c.game_id = $1
    AND c.owner_id = 0
    AND c.location = -1
    AND c.id <> (SELECT card_id FROM top_discard)
)
UPDATE cards c
SET location = (SELECT COALESCE(MAX(location), 0) + ROW_NUMBER() OVER (ORDER BY RANDOM())
                FROM cards
                WHERE game_id = $1 AND owner_id = 0 AND location > 0)
FROM to_recycle r
WHERE c.id = r.card_id
RETURNING c.id;
`;