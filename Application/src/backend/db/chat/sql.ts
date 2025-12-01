export const CREATE_MESSAGE = `
WITH new_message AS (
  INSERT INTO chat (user_id, message, game_id)
  VALUES ($1, $2, NULL)
  RETURNING *
)
SELECT
  new_message.*,
  COALESCE(users.display_name, users.username) as username,
  users.email
FROM new_message, users
WHERE new_message.user_id=users.id
`;

export const RECENT_MESSAGES = `
SELECT
  chat.*,
  COALESCE(users.display_name, users.username) as username,
  users.email
FROM chat, users
WHERE users.id=chat.user_id
ORDER BY chat.time_sent ASC
LIMIT $1
`;
