export const CREATE_GAME = `
INSERT INTO games (host_id, name, capacity, state, created_at, is_ready)
VALUES ($1, $2, $3, 'lobby', CURRENT_TIMESTAMP, false)
RETURNING *
`;

export const JOIN_GAME = `
INSERT INTO "gameParticipants" (game_id, user_id)
VALUES ($1, $2)
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
