import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("cards", {
    id: "id",
    deck_card_id: {
      type: "int",
      references: "deck_cards",
    },
    location: {
      type: "varchar(255)",
      notNull: true,
    },
    owner_id: {
      type: "int",
      references: "users",
      onDelete: "CASCADE",
    },
    game_id: {
      type: "int",
      references: "games",
      onDelete: "CASCADE",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("cards");
}
