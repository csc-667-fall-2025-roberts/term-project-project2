import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `INSERT INTO deck_cards (color, value)
    VALUES
    ('red','1'), ('red','2'), ('red','3'), ('red','4'), ('red','5'), ('red','6'), ('red','7'), ('red','8'), ('red','9'), ('red','reverse'), ('red','skip'), ('red','draw'),
    ('blue','1'), ('blue','2'), ('blue','3'), ('blue','4'), ('blue','5'), ('blue','6'), ('blue','7'), ('blue','8'), ('blue','9'), ('blue','reverse'), ('blue','skip'), ('blue','draw'),
    ('green','1'), ('green','2'), ('green','3'), ('green','4'), ('green','5'), ('green','6'), ('green','7'), ('green','8'), ('green','9'), ('green','reverse'), ('green','skip'), ('green','draw'),
    ('yellow','1'), ('yellow','2'), ('yellow','3'), ('yellow','4'), ('yellow','5'), ('yellow','6'), ('yellow','7'), ('yellow','8'), ('yellow','9'), ('yellow','reverse'), ('yellow','skip'), ('yellow','draw')
    ON CONFLICT DO NOTHING;`
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql("DELETE FROM deck_cards;");
}
