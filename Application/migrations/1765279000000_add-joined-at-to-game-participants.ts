import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add column as nullable first
  pgm.addColumn("gameParticipants", {
    joined_at: {
      type: "timestamp",
      notNull: false,
    },
  });

  // Backfill existing records with game creation time as approximation
  pgm.sql(`
    UPDATE "gameParticipants" gp
    SET joined_at = g.created_at
    FROM games g
    WHERE gp.game_id = g.id
    AND gp.joined_at IS NULL
  `);

  // Make column NOT NULL with default
  pgm.alterColumn("gameParticipants", "joined_at", {
    notNull: true,
    default: pgm.func("CURRENT_TIMESTAMP"),
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("gameParticipants", "joined_at");
}
