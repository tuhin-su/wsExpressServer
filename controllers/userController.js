const PDO = require('../config/database');

exports.getUser = async (id) => {
  const pdo = new PDO();
  const data = await pdo.execute({
    key: `user:${id}`, // Redis key
    sqlQuery: `SELECT * FROM users WHERE id = '${id}'`,
    ttl: 120, // Cache TTL in seconds
  });

  return data;
};
