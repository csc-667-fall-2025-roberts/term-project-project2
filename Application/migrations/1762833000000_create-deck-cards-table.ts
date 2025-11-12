import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("deck_cards", {
    id: "id",
    color: {
      type: "varchar(255)",
      notNull: true,
    },
    value: {
      type: "varchar(255)",
      notNull: true,
    },
  });

  pgm.addConstraint("deck_cards", "unique_color_value", "UNIQUE (color, value)");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("deck_cards");
}
