/**
 * @module database:user
 */

'use strict'

const bcrypt = require('bcrypt')
const sqlite = require('better-sqlite3')
const config = require('../config.json')

module.exports = {
    /**
     * @description Add a new user to the database
     * @param {Object} user - The user being added the database
     * @param {Function} done - A callback with the arguments (error, done)
     */
    add: async(user, done) => {
        try {
            const newUser = await new Promise((resolve, reject) => {
                const db = new sqlite(config.database.name)

                if (db.prepare('select * from users where (username) = ?').get(user.username)) {
                    reject(new Error('Username already taken'))
                } else {
                    const previousId = db.prepare('select max(id) as previousId from users').get()

                    db.prepare('insert into users values (?, ?, ?, ?, ?, ?)').run(
                        previousId.previousId !== null ? previousId.previousId + 1 : 0,
                        user.username,
                        user.name,
                        user.email,
                        bcrypt.hashSync(user.password, config.bcrypt.saltRounds),
                        JSON.stringify([]) // Add an empty liked recipe list
                    )

                    db.close()

                    resolve({
                        id: previousId.previousId !== null ? previousId.previousId + 1 : 0,
                        name: user.name
                    })
                }
            })

            done(null, newUser)
        } catch (error) {
            done(error)
        }
    },
    /**
     * @description Verify a user; login
     * @param {Object} user - The user that is we are verifying
     * @param {Function} done - A callback with the arguments (error, user)
     */
    verify: async(user, done) => {
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
                        id: dbUser.id,
                        name: dbUser.name
                    })
                } else {
                    reject(new Error('Incorrect password'))
                }
            })

            done(null, verifiedUser)
        } catch (error) {
            done(error)
        }
    },
    /**
     * @description Load the users profile from the database
     * @param {Integer} id - The id of the user whose profile we want
     * @param {Boolean} all - Whether to load all recipes or just published ones
     * @param {Function} done - A callback with the single argument (profile)
     */
    profile: async(id, all, done) => {
        try {
            const profile = await new Promise((resolve, reject) => {
                const db = new sqlite(config.database.name)
                const dbUser = db.prepare('select name from users where id = ?').get(id)

                if (!dbUser) {
                    reject(new Error('User not found'))
                }

                let dbRecipes = []

                if (all) {
                    dbRecipes = db.prepare('select * from recipes where createdBy = ? order by createdOn').all(id)
                } else {
                    dbRecipes = db.prepare('select * from recipes where createdBy = ? and published = 1 order by createdOn').all(id)
                }

                resolve({
                    name: dbUser.name,
                    recipes: dbRecipes
                })
            })

            done(null, profile)
        } catch (error) {
            done(error)
        }
    }
}
