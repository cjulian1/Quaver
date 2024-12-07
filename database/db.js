const sqlite3 = require('sqlite3').verbose();
const path = require('path')
const fs = require('fs')

const dbPath = path.resolve(__dirname, 'db.sql')
const schemaPath = path.resolve(__dirname, 'schema.sql')
const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

let sql;

const db = new sqlite3.Database('./database/db.sql', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the database successfully.')

        db.exec(schemaSQL, (schemaErr) => {
            if (schemaErr) {
                console.error(schemaErr.message)
            }
        })
    }
});

module.exports = db;