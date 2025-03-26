import express from "express";
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { Parser } from 'json2csv';

const app = express()
app.use(cors({
    origin: 'http://localhost:3000', 
  exposedHeaders: ['Content-Disposition'],
}));
app.use(express.json());

const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "mYsql@ROOT",
    database: "agency_mgmt"
})

app.post("/login", async (req,res)=>{
    const {password} = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM user WHERE user_id = ?', ['admin']);
        console.log('User found:', rows);
    
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Admin user not found' });
        }
    
        const admin = rows[0];
        console.log('Stored Hash:', admin.password);
        const match = await bcrypt.compare(password, admin.password);
        console.log('Password Match:', match);

        if (!match) {
          return res.status(401).json({ error: 'Incorrect password' });
        }
    const timestamp = new Date();
    await db.execute(
        'INSERT INTO access_history (user_id, login_time) VALUES (?, ?)',
        ['admin', timestamp]
    );
    res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.post('/submit-verification', async (req, res) => {
    const {agency_name, agency_website, agency_email, agency_contact, verification_result, remarks } = req.body;
  
    const validResults = ['ACCEPTED', 'REJECTED', 'ERROR'];
    if (!validResults.includes(verification_result)) {
      return res.status(400).json({ error: 'Invalid result value' });
    }
      
    try {
        const query = `
          INSERT INTO agency_verification 
          (checked_date, agency_name, agency_website, agency_email, agency_contact, verification_result, remarks)
          VALUES (NOW(), ?, ?, ?, ?, ?, ?)
        `;
        console.log('Received Data:', req.body);
        await db.execute(query, [
          agency_name,
          agency_website,
          agency_email,
          agency_contact,
          verification_result,
          remarks
        ]);
    
        res.status(200).json({ message: 'Verification saved successfully' });
      } catch (err) {
        console.error('Insert failed:', err);
        res.status(500).json({ error: 'Failed to save data' });
      }
});

app.get('/export-csv', async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM agency_verification');
  
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(rows);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `agency_approval_history_${timestamp}.csv`;
  
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err) {
      console.error('CSV Export Error:', err);
      res.status(500).json({ error: 'Failed to export CSV' });
    }
  });

app.listen(5001, ()=>{
    console.log("Connected to backend")
});