const sql = require('mssql');
const redis = require('redis');

let globalPool = null;
let globalRedis = null;

async function initPool() {
  if (!globalPool) {
    globalPool = await sql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      server: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      options: { trustServerCertificate: true },
    });
  }
  return globalPool;
}

async function initRedis() {
  if (!globalRedis && process.env.USE_REDIS === 'true') {
    globalRedis = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    });
    await globalRedis.connect();
  }
  return globalRedis;
}

class PDO {
  constructor() {
    this.pool = null;
    this.redis = null;
  }

  async connect() {
    this.pool = await initPool();
    this.redis = await initRedis();
  }

  async execute({ key = null, sqlQuery = '', ttl = 120 }) {
    if (!this.pool) await this.connect();

    // Try cache
    if (this.redis && key) {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached);
    }

    // DB Query
    const result = await this.pool.request().query(sqlQuery);
    const data = result.recordset;

    // Cache if enabled
    if (this.redis && key) {
      await this.redis.set(key, JSON.stringify(data), { EX: ttl });
    }

    return data;
  }
}

module.exports = PDO;
