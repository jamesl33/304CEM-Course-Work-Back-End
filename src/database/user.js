'use strict'

const bcrypt = require('bcrypt')
const sqlite = require('better-sqlite3')
const config = require('../config.json')

module.exports = {
    addUser: async(user, done) => {
        try {
            const newUser = await new Promise((resolve, reject) => {
                const db = new sqlite(config.database.name)

                if (db.prepare('select * from users where (username) = ?').get(user.username)) {
                    reject(new Error('Username already taken'))
                } else {
                    db.prepare('insert into users values (?, ?, ?, ?, ?)').run(
                        0,
                        user.username,
                        user.name,
                        user.email,
                        bcrypt.hashSync(user.password, config.bcrypt.saltRounds),
                    )

                    db.close()

                    resolve({
                        name: user.name,
                    })
                }
            })

            done(null, newUser)
        } catch (error) {
            if (error) {
                done(error)
            }
        }
    },
    verifyUser: async(user, done) => {
        try {
            const verifiedUser = await new Promise((resolve, reject) => {
                const db = new sqlite(config.database.name)

                const dbUser = db.prepare('select * from users where username = ?').get(user.username)

                if (!dbUser) {
                    reject(new Error('Could not find user, are you sure you have an account?'))
                }

                db.close()

                if (bcrypt.compareSync(user.password, dbUser.passwordHash)) {
                    resolve({
                        name: dbUser.name,
                    })
                } else {
                    reject(new Error('Incorrect password'))
                }
            })

            done(null, verifiedUser)
        } catch (error) {
            return done(error)
        }
    }
}
