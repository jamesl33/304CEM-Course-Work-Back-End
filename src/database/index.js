'use strict'

const fs = require('fs')
const sqlite = require('better-sqlite3')
const config = require('../config.json')
const user = require('./user.js')
const recipe = require('./recipe.js')

module.exports = Object.assign({}, {
    user: user,
    recipe: recipe,
    createDatabase: () => {
        const db = new sqlite(config.database.name)

        db.prepare('create table users (id integer primary key not null, username text, name text, email text, passwordHash text)').run()
        db.prepare('create table recipes (id integer primary key not null, createdBy integer not null, createdOn integer not null, title text not null, image text not null, ingredients text not null, description text not null, steps text not null, published integer not null, rating integer not null, foreign key(createdBy) references users(id))').run()

        db.close()
    }
})

if (!fs.existsSync(config.database.name)) {
    module.exports.createDatabase()
}
