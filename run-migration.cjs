const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config();
async function runMigration() {
    const pool = new Pool({
        // Use environment variables for database connection
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        port: process.env.POSTGRES_PORT,
    });

    const migrationDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationDir).sort();

    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Start a transaction

        for (const migrationFile of migrationFiles) {
            const migrationPath = path.join(migrationDir, migrationFile);
            const migrationScript = fs.readFileSync(migrationPath, 'utf8');

            try {
                // Execute the migration script inside the transaction
                await client.query(migrationScript);
                console.log(`Migration ${migrationFile} applied successfully`);
            } catch (error) {
                console.error(`Error applying migration ${migrationFile}: ${error}`);
                await client.query('ROLLBACK'); // Rollback the transaction
                throw error;
            }
        }

        await client.query('COMMIT'); // Commit the transaction
        console.log('All migrations applied successfully');
    } finally {
        client.release(); // Release the client back to the pool
        await pool.end();
    }
}

runMigration();
