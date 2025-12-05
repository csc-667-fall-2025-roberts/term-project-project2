import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("cards", "location", {
    type: "int",
    notNull: true,
    using: "location::integer",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("cards", "location", {
    type: "varchar(255)",
    notNull: true,
  });
}
