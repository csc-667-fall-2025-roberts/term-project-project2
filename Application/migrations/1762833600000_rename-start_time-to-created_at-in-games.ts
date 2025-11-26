import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("games", "start_time", "created_at");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("games", "created_at", "start_time");
}
