const express = require('express');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./Database');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ================================
// GENERATE API KEY (TIDAK SIMPAN)
// ================================
app.post('/api/generate', (req, res) => {
  const randomBytes = crypto.randomBytes(16).toString('hex').toUpperCase();
  const api_key = `dutaaja-${randomBytes}`;

  res.json({ success: true, api_key });
});

// =====================================
// SIMPAN USER + API KEY (FORM USER)
// =====================================
app.post('/api/user', (req, res) => {
  const { first_name, last_name, email, api_key } = req.body;

  if (!first_name || !last_name || !email || !api_key) {
    return res.json({ success: false, error: "Semua field wajib diisi" });
  }

  const outdate = new Date();
  outdate.setMonth(outdate.getMonth() + 1);

  const insertKey = "INSERT INTO apikey (apikey, out_of_date) VALUES (?, ?)";

  db.query(insertKey, [api_key, outdate], (err, result) => {
    if (err) return res.json({ success: false, error: "Gagal simpan API Key" });

    const apikey_id = result.insertId;

    const sqlUser = `
      INSERT INTO user (first_name, last_name, email, apikey_id)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sqlUser, [first_name, last_name, email, apikey_id], (err2) => {
      if (err2) return res.json({ success: false, error: "Email sudah digunakan" });

      res.json({ success: true });
    });
  });
});

