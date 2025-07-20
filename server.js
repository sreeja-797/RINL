const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

app.use(express.static(__dirname)); // Serve static files (HTML, CSS, etc.)
app.use(bodyParser.urlencoded({ extended: true })); // To parse form data
app.use(session({
  secret: 'rinl_secret_key',
  resave: false,
  saveUninitialized: true
}));



const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Sreeja@2006', // Or your actual MySQL password
  database: 'rinlusers'
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL connected...');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.log(err);
      return res.send('Error while checking login.');
    }

    if (result.length > 0) {
      req.session.username = username;
      res.redirect('/welcome.html'); // ✅ Must match filename exactly
    } else {
      res.send('Invalid username or password');
    }
  });
});
app.listen(3000, '0.0.0.0', () => {
  console.log('Server is running at http://192.168.137.1:3000');
});


// app.listen(3000, () => {
//   console.log('Server started on port 3000');
// });
app.post('/submit-delay', (req, res) => {
  const { shop_code, startTime, endTime } = req.body;
  const username = req.session.username;

  if (!username) {
    return res.send('User not logged in');
  }

  const sql = 'INSERT INTO delaysentry (username, shop_code, start_time, end_time) VALUES (?, ?, ?, ?)';
  db.query(sql, [username, shop_code, startTime, endTime], (err, result) => {
    if (err) {
      console.error('Error saving delay:', err);
      return res.send('Error saving delay');
    }

    // Stylish Success Response
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Delay Saved</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #2f2f74, #2a9fd6);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
          }

          .message-box {
            background-color: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          }

          h1 {
            font-size: 32px;
            margin-bottom: 20px;
            text-shadow: 1px 1px 2px #000;
          }

          a {
            margin-top: 20px;
            display: inline-block;
            text-decoration: none;
            background: #6a1b9a;
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            transition: background 0.3s ease;
          }

          a:hover {
            background: #52177a;
          }
        </style>
      </head>
      <body>
        <div class="message-box">
          <h1>Delay Saved Successfully ✅</h1>
          <p>Your delay for <strong>${shop_code}</strong> has been recorded.</p>
          <a href="/delay.html">← Go Back to Delay Page</a>
        </div>
      </body>
      </html>
    `);
  });
});

app.post('/generate-report', (req, res) => {
  const { shop_code, startTime, endTime } = req.body;

  const query = `
    SELECT username, shop_code, start_time, end_time 
    FROM delaysentry 
    WHERE shop_code = ? AND start_time >= ? AND end_time <= ?
  `;

  db.query(query, [shop_code, startTime, endTime], (err, results) => {
    if (err) {
      console.error('Error fetching report data:', err);
      return res.send('Failed to fetch report.');
    }

    // Count delays per user
    const userCounts = {};
    results.forEach(row => {
      userCounts[row.username] = (userCounts[row.username] || 0) + 1;
    });

    res.send(`
  <html>
  <head>
    <title>Delay Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      body {
        font-family: 'Poppins', sans-serif;
        background: linear-gradient(135deg, #2f2f74, #2a9fd6);
        color: white;
        padding: 20px;
      }
      table {
        width: 100%;
        margin-top: 20px;
        border-collapse: collapse;
        background-color: white;
        color: black;
        border-radius: 10px;
        overflow: hidden;
      }
      th, td {
        padding: 10px;
        border: 1px solid #ccc;
        text-align: center;
      }
      th {
        background-color: #2f2f74;
        color: white;
      }
      .chart-container {
        background: linear-gradient(135deg, #2f2f74, #2a9fd6);
        padding: 20px;
        border-radius: 15px;
        margin-top: 40px;
        width: 350px;
        height: 350px;
         display: flex;
        justify-content: center;
       align-items: center;
        margin-left: auto;
        margin-right: auto;
      }
      canvas#chart {
        width: 300px !important;
        height: 300px !important;
      }
    </style>
  </head>
  <body>
    <h2>Delay Report for Shop Code ${shop_code}</h2>
    
    <table>
      <tr><th>Username</th><th>Shop Code</th><th>Start Time</th><th>End Time</th></tr>
      ${results.map(row => `
        <tr>
          <td>${row.username}</td>
          <td>${row.shop_code}</td>
          <td>${row.start_time}</td>
          <td>${row.end_time}</td>
        </tr>
      `).join('')}
    </table>

    <div class="chart-container">
      <canvas id="chart"></canvas>
    </div>

    <script>
      const ctx = document.getElementById('chart').getContext('2d');
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(Object.keys(userCounts))},
          datasets: [{
            label: 'Number of Delays',
            data: ${JSON.stringify(Object.values(userCounts))},
            backgroundColor: '#6a1b9a',
            borderRadius: 6
          }]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Delays per User',
              color: '#fff',
              font: {
                size: 18
              }
            },
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              ticks: { color: '#fff' }
            },
            y: {
              ticks: { color: '#fff' }
            }
          },
          responsive: false,
          maintainAspectRatio: false
        }
      });
    </script>
  </body>
  </html>
`);

  });
}); 