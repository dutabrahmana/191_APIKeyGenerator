const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',        
  password: 'Duta123.',      
  database: 'apikey_db', 
  port: 3309
});

db.connect((err) => {
  if (err) {
    console.error('❌ Gagal konek ke database:', err);
  } else {
    console.log('✅ Terhubung ke database MySQL apikey_db!');
  }
});

module.exports = db;
