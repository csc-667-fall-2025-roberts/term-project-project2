import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("chat", {
    id: "id",
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
    message: {
      type: "varchar(255)",
      notNull: true,
      check: "message != ''",
    },
    time_sent: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("chat");
}
