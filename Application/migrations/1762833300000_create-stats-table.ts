import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("stats", {
    user_id: {
      type: "int",
      references: "users",
      onDelete: "CASCADE",
      primaryKey: true,
    },
    games_won: {
      type: "int",
      notNull: true,
      default: 0,
    },
    games_played: {
      type: "int",
      notNull: true,
      default: 0,
    },
    winning_percentage: {
      type: "float",
      notNull: true,
      default: 0,
    },
    streak: {
      type: "int",
      notNull: true,
      default: 0,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("stats");
}
