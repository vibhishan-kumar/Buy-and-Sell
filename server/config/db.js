const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

let pool = null;
let pgliteInstance = null;
let isUsingPglite = false;

// Ensure local data directory exists for PGlite storage
const dataDir = path.join(__dirname, '..', 'data', 'pgdata');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function initDB() {
  // If explicitly configured with DATABASE_URL or DB_HOST, try standard pg
  if (process.env.DATABASE_URL || process.env.DB_HOST) {
    try {
      const { Pool } = require('pg');
      const connectionConfig = process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT, 10) || 5432,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'uoh_marketplace',
          };

      const testPool = new Pool(connectionConfig);
      await testPool.query('SELECT 1 AS alive');
      pool = testPool;
      isUsingPglite = false;
      console.log('Connected to PostgreSQL server successfully.');
      return;
    } catch (err) {
      console.warn('Could not connect to external PostgreSQL server:', err.message);
      console.log('Falling back to embedded PostgreSQL (PGlite) for zero-setup execution...');
    }
  }

  // Fallback or default: Embedded PostgreSQL via PGlite
  const { PGlite } = require('@electric-sql/pglite');
  pgliteInstance = new PGlite(dataDir);
  isUsingPglite = true;
  console.log(`Initialized embedded PostgreSQL (PGlite) at ${dataDir}`);

  // Safe schema migration for payment_method and payment_details
  try {
    const alterSQL = `
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'CARD';
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_details TEXT;
    `;
    if (!isUsingPglite && pool) {
      await pool.query(alterSQL);
    } else if (pgliteInstance) {
      await pgliteInstance.exec(alterSQL);
    }
  } catch (e) {
    // Table may not exist yet if unseeded
  }
}

async function query(text, params = []) {
  if (!pool && !pgliteInstance) {
    await initDB();
  }

  if (!isUsingPglite && pool) {
    const res = await pool.query(text, params);
    return res;
  } else if (pgliteInstance) {
    const res = await pgliteInstance.query(text, params);
    return {
      rows: res.rows || [],
      rowCount: res.affectedRows !== undefined ? res.affectedRows : (res.rows ? res.rows.length : 0),
      fields: res.fields || []
    };
  } else {
    throw new Error('Database not initialized');
  }
}

async function exec(sql) {
  if (!pool && !pgliteInstance) {
    await initDB();
  }
  if (!isUsingPglite && pool) {
    return await pool.query(sql);
  } else if (pgliteInstance) {
    return await pgliteInstance.exec(sql);
  }
}

// Transaction client wrapper
async function getTransactionClient() {
  if (!pool && !pgliteInstance) {
    await initDB();
  }

  if (!isUsingPglite && pool) {
    const client = await pool.connect();
    return {
      query: (text, params) => client.query(text, params),
      release: () => client.release()
    };
  } else if (pgliteInstance) {
    // PGlite handles queries in a single process. Transactions work via BEGIN / COMMIT / ROLLBACK queries
    return {
      query: async (text, params) => {
        const res = await pgliteInstance.query(text, params);
        return {
          rows: res.rows || [],
          rowCount: res.affectedRows !== undefined ? res.affectedRows : (res.rows ? res.rows.length : 0),
          fields: res.fields || []
        };
      },
      release: () => {} // no-op for embedded
    };
  }
}

module.exports = {
  initDB,
  query,
  exec,
  getTransactionClient,
  isPGlite: () => isUsingPglite
};
