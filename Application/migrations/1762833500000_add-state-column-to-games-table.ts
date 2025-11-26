import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("games", {
    state: {
      type: "varchar(255)",
      notNull: true,
      default: "pending", // Change default if needed
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("games", "state");
}
