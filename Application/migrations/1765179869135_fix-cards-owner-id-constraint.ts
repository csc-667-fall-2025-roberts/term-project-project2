
import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Drop the foreign key constraint on owner_id
  pgm.dropConstraint('cards', 'cards_owner_id_fkey');
  
  // Make owner_id nullable (allows 0 or NULL for draw/discard piles)
  pgm.alterColumn('cards', 'owner_id', {
    notNull: false,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Re-add the foreign key constraint
  pgm.addConstraint('cards', 'cards_owner_id_fkey', {
    foreignKeys: {
      columns: 'owner_id',
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
  });
  
  // Make owner_id not null again
  pgm.alterColumn('cards', 'owner_id', {
    notNull: true,
  });
}
