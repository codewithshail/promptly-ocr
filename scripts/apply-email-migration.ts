import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function applyEmailMigration() {
  try {
    console.log('Applying email schema migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(process.cwd(), 'db/migrations/apply-email-schema.sql'),
      'utf-8'
    );
    
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Email schema migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyEmailMigration();
