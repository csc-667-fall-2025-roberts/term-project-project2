import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("moves", {
    id: "id",
    game_id: {
      type: "int",
      references: "games",
      onDelete: "CASCADE",
    },
    user_id: {
      type: "int",
      references: "users",
      onDelete: "CASCADE",
    },
    play_type: {
      type: "varchar(255)",
      notNull: true,
      check: "play_type IN ('play', 'draw', 'skip', 'reverse')",
    },
    card_id: {
      type: "int",
      references: "cards",
      onDelete: "CASCADE",
    },
    draw_amount: {
      type: "int",
    },
    chosen_color: {
      type: "varchar(255)",
      check: "chosen_color IS NULL OR chosen_color IN ('blue', 'red', 'green', 'yellow')",
    },
    reverse: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("moves");
}
