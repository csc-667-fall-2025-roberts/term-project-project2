// Record a move
export const CREATE_MOVE = `
INSERT INTO moves (game_id, user_id, play_type, card_id, draw_amount, chosen_color, reverse)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *
`;

// Get all moves for a game
export const GET_GAME_MOVES = `
SELECT m.*, u.username, dc.color, dc.value
FROM moves m
JOIN users u ON m.user_id = u.id
LEFT JOIN cards c ON m.card_id = c.id
LEFT JOIN deck_cards dc ON c.deck_card_id = dc.id
WHERE m.game_id = $1
ORDER BY m.id ASC
`;

// Get last move in a game
export const GET_LAST_MOVE = `
SELECT m.*, u.username, dc.color, dc.value
FROM moves m
JOIN users u ON m.user_id = u.id
LEFT JOIN cards c ON m.card_id = c.id
LEFT JOIN deck_cards dc ON c.deck_card_id = dc.id
WHERE m.game_id = $1
ORDER BY m.id DESC
LIMIT 1
`;


export const GET_TURN_DIRECTION = `
SELECT
  CASE WHEN COUNT(*) FILTER (WHERE reverse = true) % 2 = 0
  THEN 1 ELSE -1 END as direction
FROM moves
WHERE game_id = $1
`;

// Get move count for a game 
export const GET_MOVE_COUNT = `
SELECT COUNT(*) as count
FROM moves
WHERE game_id = $1
AND play_type IN ('play', 'reverse')
`;

