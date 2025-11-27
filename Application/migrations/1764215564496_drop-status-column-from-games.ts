import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("games", "status");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("games", {
    status: {
      type: "varchar(255)",
      notNull: true,
      check: "status IN ('in_progress', 'ended')",
    },
  });
}
