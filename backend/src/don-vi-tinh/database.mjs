// src/dai-ly/database.mjs
import pkg from 'pg';
const { Pool } = pkg;
import { DsqlSigner } from '@aws-sdk/dsql-signer';

let pool;
let tokenExpiryTime;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

async function generateNewToken() {
  const signer = new DsqlSigner({
    hostname: process.env.DATABASE_HOST,
    region: process.env.DATABASE_REGION,
  });

  const token = await signer.getDbConnectAdminAuthToken();
  
  // DSQL tokens typically expire in 15 minutes, set expiry time
  tokenExpiryTime = Date.now() + (15 * 60 * 1000) - TOKEN_REFRESH_BUFFER_MS;
  
  console.log('New admin token generated successfully, expires at:', new Date(tokenExpiryTime + TOKEN_REFRESH_BUFFER_MS));
  return token;
}

function isTokenExpired() {
  return !tokenExpiryTime || Date.now() >= tokenExpiryTime;
}

async function initializePool() {
  const token = await generateNewToken();

  pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: 5432,
    user: process.env.DATABASE_USER,
    password: token,
    database: process.env.DATABASE_NAME,
    ssl: true,
    max: 10,
    idleTimeoutMillis: 120000,
    connectionTimeoutMillis: 30000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    if (err.code === '08006' && err.hint && err.hint.includes('Signature expired')) {
      console.log('Token expired, will reinitialize pool on next query');
      pool = null;
      tokenExpiryTime = null;
    }
  });

  console.log('Connection pool initialized successfully');
}

async function getPool() {
  // Check if pool needs reinitialization due to expired token
  if (!pool || isTokenExpired()) {
    console.log('Reinitializing pool due to expired token or missing pool');
    pool = null; // Ensure clean reinitialization
    await initializePool();
  }
  return pool;
}

export async function query(text, params) {
  let client;
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      const currentPool = await getPool();
      client = await currentPool.connect();
      
      const result = await client.query(text, params);
      return result;
      
    } catch (error) {
      if (client) {
        client.release();
        client = null;
      }

      // Check if error is due to expired token
      if (error.code === '08006' && error.hint && error.hint.includes('Signature expired')) {
        console.log(`Token expired error on attempt ${retryCount + 1}, reinitializing pool...`);
        pool = null;
        tokenExpiryTime = null;
        retryCount++;
        
        if (retryCount <= maxRetries) {
          console.log(`Retrying query (attempt ${retryCount + 1}/${maxRetries + 1})...`);
          continue;
        }
      }
      
      // Re-throw the error if it's not a token expiry or we've exceeded retries
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }
}