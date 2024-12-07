const express = require('express')
const bodyParser = require('body-parser')
const db = require('./database/db')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const jwtSecretKey = 'secret'
const path = require('path')
const fs = require('fs')

const bcrypt = require('bcrypt')
const saltRounds = 10

const { spawn } = require('child_process')

const app = express()
const port = 3000

app.use(bodyParser.json())
app.use(cors())
app.use(express.json())

module.exports = app

function authenticate(req, res, next) {    // check to see if users token is valid
    const authHeader = req.headers['authorization']
    const token = req.headers.authorization?.split(' ')[1]

    console.log('Authorization header: ', authHeader)
    console.log('Token:', token)

    if (!token) {
        console.log('no token')
        return res.status(401).json({error: 'no token'})
    }

    jwt.verify(token, jwtSecretKey, (err, user) => {    // verify token using secret key
        if (err) {
            console.log(err.message)
            return res.status(401).json({error: 'bad token'})
        }

        console.log('token verified: ', user)
        req.user = user
        next()
    })
}

app.use('/midi-f', express.static(path.join(__dirname, 'midis')))

app.get('/create', authenticate, (req, res) => {
    res.json({message: 'access granted'})
})

app.post('/api/notes', authenticate, (req, res) => {    // generate and create midi file
    const { notes, fileName } = req.body                    // gets melody and requested file name
    console.log('Midi notes: ', notes, ' from userID:', req.user.userID)

    const pyScript = spawn('python', ['generate_chords.py'])    // spawns python process
    
    let pyOutput = ''

    pyScript.stdin.write(JSON.stringify(notes))           // passes notes to python process
    pyScript.stdin.end()

    pyScript.stdout.on('data', (data) => {
        pyOutput += data.toString()                        // gets printed output from python process
    })

    pyScript.on('close', (code) => {
        if (code === 0) {
            const midiFileName = `${fileName.trim().replace(/\s+/g, '_')}_${req.user.userID}.mid`
            const midiFilePath = path.join(__dirname, 'midis', midiFileName)                        
            fs.renameSync(pyOutput.trim(), midiFilePath)

            const midiFileUrl = `/midi-f/${midiFileName}`

            console.log('Midi file name:', midiFileName)
            
            const sqlCheck = 'SELECT * FROM files WHERE file_path = ? AND userID = ?'

            db.get(sqlCheck, [midiFileUrl, req.user.userID], (err, oldFile) => {    // check if file name exists in database
                if (err) {
                    console.error(err.message)
                    return res.json({ success: false, message: err.message})
                }

                if (oldFile) {
                    const sqlUpdate = 'UPDATE files SET file_path = ?, melody_notes = ? WHERE ID = ?'
                    db.run(sqlUpdate, [midiFileUrl, JSON.stringify(notes), oldFile.id], function (err2) {    // if file name exists in database, update record in database
                        if (err2) {
                            console.error(err2.message)
                            return res.json({ success: false, message: err2.message })
                        }

                        res.json({ success: true, message: 'updated record', midiFile: midiFileUrl, fileID: this.lastID })
                    })
                } else {
                    const sql = 'INSERT INTO files (userID, file_path, melody_notes) VALUES (?, ?, ?)'    // if file name doesn't exist in database, add file name to database
                    db.run(sql, [req.user.userID, midiFileUrl, JSON.stringify(notes)], function (err) {
                        if (err) {
                            console.error(err.message)
                        }

                        res.json({ success: true, midiFile: midiFileUrl})    // return midi file url
                    })
                }
            })
        } else {
            console.log('python failed')
            res.json({ success: false, message: 'python failed :('})
        }
    })
})

app.get('/api/files', authenticate, (req, res) => { // get users files
    const sql = 'SELECT id, file_path, melody_notes FROM files WHERE userID = ?'
    console.log('Getting files for user:', req.user.userID)
    db.all(sql, [req.user.userID], (err, rows) => {    // get all records where ID matches the ID of the current user
        if (err) {
            console.error(err.message)
            return res.json({ success: false, message: 'Error'})
        }

        const files = rows.map(file => ({
            ...file,
            melody_notes: JSON.parse(file.melody_notes)
        }))

        res.json({ success: true, files })
    })
})

app.put('/api/files/:id', authenticate, (req, res) => { // rename midi file
    
    const { id } = req.params
    const { newName } = req.body
    const sql = 'SELECT file_path FROM files WHERE id = ?'

    db.get(sql, [id], (err, row) => {    // get file by ID
        
        console.log('ID = ' + id)
        
        if (err) {
            console.error(err.message)
            return res.json({ success: false, error: error.message})
        }

        if (!row) {
            return res.json({ success: false, error: 'Wrong ID'})
        }

        const oldFilePath = path.join(__dirname, 'midis', row.file_path.replace('/midi-f', ''))
        
        let newFileName = newName
        midIndex = newName.lastIndexOf('.mid')
        
        const fileNameNoExt = newName.substring(0, midIndex === -1 ? newName.length : midIndex)
        const fileUser = fileNameNoExt.split('_').pop()
        const userId = String(req.user.userID).trim()

        if (fileUser !== userId)                                        // if file name doesn't contain the user ID at the end, add it
            if (midIndex !== -1) {
                newFileName = newName.substring(0, midIndex) + '_' + req.user.userID + newName.substring(midIndex)
            } else {
                newFileName += '_' + req.user.userID + '.mid'
            }
        
        const newFilePath = path.join(__dirname, 'midis', newFileName)

        fs.rename(oldFilePath, newFilePath, (err2) => {
            if (err2) {
                console.error(err2.message)
                return res.json({ success: false, error: err2.message })
            }

            const sqlUpdate = 'UPDATE files SET file_path = ? WHERE id = ?'
            const newFileUrl = `/midi-f/${newName}`
            db.run(sqlUpdate, [newFileUrl, id], (err3) => {
                if (err3) {
                    console.error(err3.message)
                    return res.json({ success: false, error: err3.message })
                }
                
                res.json({ success: true, message: 'File renamed'})
            })

            
        })
    })
})

app.delete('/api/files/:id', authenticate, (req, res) => {  // delete midi file
    const fileID = req.params.id

    const sql = 'SELECT file_path FROM files WHERE id = ?'
    db.get(sql, [fileID], (err, row) => {
        if (err) {
            console.error(err.message)
            return res.json({ error: 'Error'})
        }

        if (!row) {
            return res.json({ error: 'No file?'})
        }

        const filePath = path.join(__dirname, 'midis', row.file_path.split('/').pop())

        fs.unlink(filePath, (err2) => {
            if (err2) {
                console.error(err2.message)
                return res.json({ error: `Couldn't delete file`})
            }

            const delSql = 'DELETE FROM files WHERE id = ?'
            db.run(delSql, [fileID], function (err3) {
                if (err3) {
                    console.error(err3.message)
                    return res.json({ error: `Couldn't delete from database`})
                }

                res.json({ sucess: true})
            })
        })
    })
})

/// CRUD for users /// vvv

app.post('/register', (req, res) => {  // register
    const { username, password } = req.body

    bcrypt.hash(password, saltRounds, (err, hashedPass) => {    // hash password
        if(err) {
            console.error(err.message)
        }

        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)'
        db.run(sql,[username, hashedPass], function (err) {     // add username and hashed password to database
            if (err) {
                console.error(err.message)
            } else {
                res.json({message: 'registration successful', id: this.lastID})
            }
        })
    })
})

app.post('/login', (req, res) => {  // login
    const { username, password } = req.body

    const sql = 'SELECT * FROM users WHERE username = ?'
    db.get(sql, [username], (err, user) => {
        if (err) {
            console.error(err.message)
        }
    
        if (!user) {
            return res.json({error: 'user not found'})
        }
        
        bcrypt.compare(password, user.password, (err, isMatch) => {    // compare password with hash
            if (err) {
                console.error(err.message)
            }
            
            if (!isMatch) {
                return res.json({error: 'incorrect password'})
            }
            
            const token = jwt.sign({userID: user.id}, jwtSecretKey, {expiresIn: 43200})    // generate new token that expires in 12 hours
            res.json({message: 'login successful', token, userID: user.id})
        })
    })
})

app.get('/users', (req, res) => {    // get all users in database
    const sql = 'SELECT * FROM users'
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message)
        } else {
            res.json(rows)
        }
    })
})

app.put('/users/:id', (req, res) => {    // change username
    const username = req.body
    const id = req.params.id
    const sql = 'UPDATE users SET username = ? WHERE id = ?'
    
    db.run(sql, [username, id], function (err) {
        if (err) {
            console.error(err.message)
        } else {
            res.json({updated: this.changes})
        }
    })
})

app.delete('/users/:id', (req, res) => {    // delete user
    const id = req.params.id
    const sql = 'DELETE FROM users WHERE id = ?'
    db.run(sql, id, function (err) {
        if (err) {
            console.error(err.message)
        } else {
            res.json({deleted: this.changes})
        }
    })
})

/// CRUD for users /// ^^^

app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})
