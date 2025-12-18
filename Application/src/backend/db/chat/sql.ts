export const CREATE_GAME_MESSAGE = `
WITH new_message AS (
  INSERT INTO chat (user_id, message, game_id)
  VALUES ($1, $2, $3)
  RETURNING *
)
SELECT
  new_message.id,
  new_message.user_id,
  new_message.message,
  new_message.time_sent as created_at,
  COALESCE(users.display_name, users.username) as username,
  users.email
FROM new_message, users
WHERE new_message.user_id=users.id
`;

export const CREATE_LOBBY_MESSAGE = `
WITH new_message AS (
  INSERT INTO chat (user_id, message, game_id)
  VALUES ($1, $2, NULL)
  RETURNING *
)
SELECT
  new_message.id,
  new_message.user_id,
  new_message.message,
  new_message.time_sent as created_at,
  COALESCE(users.display_name, users.username) as username,
  users.email
FROM new_message, users
WHERE new_message.user_id=users.id
`;


export const RECENT_LOBBY_MESSAGES = `
SELECT
  chat.id,
  chat.user_id,
  chat.message,
  chat.time_sent as created_at,
  COALESCE(users.display_name, users.username) as username,
  users.email
FROM chat, users
WHERE users.id=chat.user_id
  AND chat.game_id IS NULL
ORDER BY chat.time_sent ASC
LIMIT $1
`;

export const RECENT_GAME_MESSAGES = `
SELECT
  chat.id,
  chat.user_id,
  chat.message,
  chat.game_id,
  chat.time_sent as created_at,
  COALESCE(users.display_name, users.username) as username,
  users.email
FROM chat
JOIN users ON users.id = chat.user_id
JOIN "gameParticipants" gp ON gp.game_id = chat.game_id AND gp.user_id = $2
WHERE chat.game_id = $1
  AND chat.time_sent >= gp.joined_at
ORDER BY chat.time_sent ASC
LIMIT $3
`;