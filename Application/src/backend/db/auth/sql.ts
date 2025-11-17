export const SIGNUP = `
INSERT INTO users (username, email, password, display_name)
VALUES ($1, $2, $3, $4)
RETURNING id, username, email, display_name, created_at
`;

export const LOGIN = `
SELECT * FROM users 
WHERE username=$1
`;

export const UPDATE_DISPLAY_NAME = `
UPDATE users
SET display_name = $1
WHERE id = $2
`;
