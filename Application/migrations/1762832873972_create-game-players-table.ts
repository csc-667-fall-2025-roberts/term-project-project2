import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(
    "gameParticipants",
    {
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
      player_order: {
        type: "int",
        notNull: true,
      },
      is_winner: {
        type: "boolean",
        default: false,
      },
      disconnected: {
        type: "boolean",
        default: false,
      },
    },
    {
      constraints: {
        primaryKey: ["game_id", "user_id"],
      },
    }
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("gameParticipants");
}
