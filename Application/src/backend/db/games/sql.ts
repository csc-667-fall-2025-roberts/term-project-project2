export const CREATE_GAME = `
INSERT INTO games (host_id, name, capacity, state, created_at, is_ready)
VALUES ($1, $2, $3, 'lobby', CURRENT_TIMESTAMP, false)
RETURNING *
`;

export const JOIN_GAME = `
INSERT INTO "gameParticipants" (game_id, user_id, player_order)
VALUES ($1, $2, (SELECT COALESCE(MAX(player_order), 0) + 1 FROM "gameParticipants" WHERE game_id = $1))
`;

export const LIST_GAMES = `
SELECT
  g.*,
  COALESCE(host.display_name, host.username) as host_username,
  COUNT(gp.user_id) AS player_count,
  COALESCE(
    json_agg(
      json_build_object(
        'user_id', gp.user_id,
        'username', u.username,
        'email', u.email
      )
    ) FILTER (WHERE gp.user_id IS NOT NULL),
    '[]'
  ) AS players
FROM games g
LEFT JOIN users host ON g.host_id = host.id
LEFT JOIN "gameParticipants" gp ON g.id=gp.game_id
LEFT JOIN users u ON u.id=gp.user_id
WHERE g.state=$1
GROUP BY g.id, COALESCE(host.display_name, host.username)
ORDER BY g.created_at DESC
LIMIT $2
`;

export const GAMES_BY_USER = `
SELECT games.* FROM "gameParticipants", games
WHERE "gameParticipants".game_id=games.id AND user_id=$1
`;

export const GAME_BY_ID = `
  SELECT
    g.*,
    COALESCE(u.display_name, u.username) as host_username
  FROM games g
  LEFT JOIN users u ON g.host_id = u.id
  WHERE g.id=$1
`;

// get players in a game
export const GET_PLAYERS = `
SELECT user_id, username, email, display_name, player_order FROM "gameParticipants"
JOIN users ON users.id = user_id
WHERE game_id = $1 ORDER BY player_order
`;

// set players positions
export const SET_PLAYER_POSITION = `
UPDATE "gameParticipants" SET player_order = $2 WHERE game_id = $1 AND user_id = $3
`;


// Start game
export const START_GAME = `
UPDATE games SET state = 'in_progress', is_ready = true WHERE id = $1
`;

// update game 
export const UPDATE_GAME = `
UPDATE games
SET state = $2, winner_id = $3, is_ready = $4
WHERE id = $1
RETURNING *
`;

// Leave game
export const LEAVE_GAME = `
DELETE FROM "gameParticipants" WHERE game_id = $1 AND user_id = $2
`;

// Get player count
export const GET_PLAYER_COUNT = `
SELECT COUNT(*) as count FROM "gameParticipants" WHERE game_id = $1
`;

// Check if player is in game
export const CHECK_PLAYER_IN_GAME = `
SELECT EXISTS(SELECT 1 FROM "gameParticipants" WHERE game_id = $1 AND user_id = $2) as is_player
`;


