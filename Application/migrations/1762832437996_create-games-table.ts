import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("games", {
    id: "id",
    host_id: {
      type: "int",
      references: "users",
      onDelete: "CASCADE",
    },
      created_at: {
        type: "timestamp",
        notNull: true,
      },
    is_ready: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    capacity: {
      type: "int",
      notNull: true,
      check: "capacity > 2 AND capacity < 11",
    },
    winner_id: {
      type: "int",
      references: "users",
      onDelete: "CASCADE",
    },
    status: {
      type: "varchar(255)",
      notNull: true,
      check: "status IN ('in_progress', 'ended')",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("games");
}
