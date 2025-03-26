import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'mYsql@ROOT',
  database: 'agency_mgmt',
});

const password = 'adminpassword';
const hashedPassword = await bcrypt.hash(password, 10);

await connection.execute(
  'INSERT INTO user (user_id, user_name, password) VALUES (?, ?, ?)',
  ['admin', 'administrator', hashedPassword]
);

console.log('Admin user inserted with hashed password.');
await connection.end();
