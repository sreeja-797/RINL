// db.js
const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Sreeja@2006',         // put your MySQL password if any
  database: 'rinlusers' // your actual database name
});

db.connect((err) => {
  if (err) throw err;
  console.log('✅ Connected to MySQL database!');
});

module.exports = db;
