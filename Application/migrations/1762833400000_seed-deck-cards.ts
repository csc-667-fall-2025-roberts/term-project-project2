import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `INSERT INTO deck_cards (color, value)
    VALUES
    ('red','0'), ('red','1'), ('red','2'), ('red','3'), ('red','4'), ('red','5'), ('red','6'), ('red','7'), ('red','8'), ('red','9'), ('red','skip'), ('red','reverse'), ('red','draw_two'),
    ('blue','0'), ('blue','1'), ('blue','2'), ('blue','3'), ('blue','4'), ('blue','5'), ('blue','6'), ('blue','7'), ('blue','8'), ('blue','9'), ('blue','skip'), ('blue','reverse'), ('blue','draw_two'),
    ('green','0'), ('green','1'), ('green','2'), ('green','3'), ('green','4'), ('green','5'), ('green','6'), ('green','7'), ('green','8'), ('green','9'), ('green','skip'), ('green','reverse'), ('green','draw_two'),
    ('yellow','0'), ('yellow','1'), ('yellow','2'), ('yellow','3'), ('yellow','4'), ('yellow','5'), ('yellow','6'), ('yellow','7'), ('yellow','8'), ('yellow','9'), ('yellow','skip'), ('yellow','reverse'), ('yellow','draw_two'),
    ('wild','wild'), ('wild','wild_draw_four')
    ON CONFLICT DO NOTHING;`
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql("DELETE FROM deck_cards;");
}
