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

// =====================================
// REGISTER ADMIN ✅ (FIXED)
// =====================================
app.post("/api/admin/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "Email dan password wajib diisi" });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.json({ success: false, message: "Gagal hash password" });

    const sql = "INSERT INTO admin (email, password) VALUES (?, ?)";

    db.query(sql, [email, hash], (err2) => {
      if (err2) {
        console.log(err2);
        return res.json({ success: false, message: "Email sudah digunakan" });
      }

      res.json({ success: true, message: "Admin registered!" });
    });
  });
});

// =====================================
// ===== ADMIN LOGIN =====
app.post("/admin/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: "Email dan password wajib diisi" });
    }

    const sql = "SELECT * FROM admin WHERE email = ? LIMIT 1";

    db.query(sql, [email], (err, rows) => {
        if (err) {
            console.log(err);
            return res.json({ success: false, message: "Kesalahan server" });
        }

        if (rows.length === 0) {
            return res.json({ success: false, message: "Email atau password salah" });
        }

        const admin = rows[0];

        bcrypt.compare(password, admin.password, (err, match) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: "Kesalahan server" });
            }

            if (!match) {
                return res.json({ success: false, message: "Email atau password salah" });
            }

            return res.json({ success: true, message: "Login berhasil" });
        });
    });
});

// =====================================
// DASHBOARD ADMIN - AMBIL DATA USER+API
// =====================================
app.get("/api/admin/dashboard", (req, res) => {
  const sql = `
    SELECT user.id, first_name, last_name, email, apikey.apikey, apikey.out_of_date
    FROM user
    LEFT JOIN apikey ON apikey.id = user.apikey_id
    ORDER BY user.id DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.json({ success: false });

    res.json({ success: true, data: rows });
  });
});

// =====================================
// HAPUS USER (DARI DASHBOARD ADMIN)
// =====================================
app.delete("/api/admin/delete/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM user WHERE id = ?";

  db.query(sql, [id], (err) => {
    if (err) return res.json({ success: false });

    res.json({ success: true });
  });
});

