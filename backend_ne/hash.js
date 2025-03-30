//This code was used to create the Admin user as an onetime task. 
//Later user registration & pwd change facility need to be provided to support multiple users.
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'mYsql@ROOT',
  database: 'agency_mgmt',
});

const hashedPassword = await bcrypt.hash(password, 10);

await connection.execute(
  'INSERT INTO user (user_id, user_name, password) VALUES (?, ?, ?)',
  ['admin', 'administrator', hashedPassword]
);

console.log('Admin user inserted with hashed password.');
await connection.end();
