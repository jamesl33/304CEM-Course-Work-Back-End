'use strict'

const fs = require('fs')
const sqlite = require('better-sqlite3')
const config = require('../config.json')
const user = require('./user.js')

module.exports = Object.assign({}, user, {
    createDatabase: () => {
        const db = new sqlite(config.database.name)

        db.prepare('create table users (id integer, username text, name text, email text, passwordHash text)').run()

        db.close()
    }
})

if (!fs.existsSync(config.database.name)) {
    module.exports.createDatabase()
}
