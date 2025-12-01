import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("games", "status");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("games", {
    status: {
      type: "varchar(255)",
      notNull: true,
      default: "in_progress",
      check: "status IN ('in_progress', 'ended')",
    },
  });
  // Ensure no NULL values remain after adding the column
  pgm.sql("UPDATE games SET status = 'in_progress' WHERE status IS NULL;");
}
