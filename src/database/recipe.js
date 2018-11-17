'use strict'

const sqlite = require('better-sqlite3')
const config = require('../config.json')

async function _save(user, recipe, publish) {
    try {
        await new Promise((resolve) => {
            const db = new sqlite(config.database.name)
            const userId = db.prepare('select id from users where name = ?').get(user.name)
            const previousId = db.prepare('select max(id) as previousId from recipes').get()

            db.prepare('insert into recipes values (?, ?, ?, ?, ?, ?)').run(
                previousId.previousId !== null ? previousId.previousId + 1 : 0,
                userId.id,
                recipe.title,
                recipe.description,
                JSON.stringify(recipe.steps),
                publish ? 1 : 0,
            )

            db.close()

            resolve()
        })
    } catch (error) {
        console.log(error) // We shouldn't need to send this to the user. Hense no callback.
    }
}

module.exports = {
    save: (user, recipe) => {
        return _save(user, recipe, false)
    },
    publish: (user, recipe) => {
        return _save(user, recipe, true)
    },
    togglePublished: async(recipe) => {
        try {
            await new Promise((resolve) => {
                const db = new sqlite(config.database.name)

                db.prepare('update recipes set published = not published where id = ?').run(recipe.id)

                db.close()

                resolve()
            })
        } catch (error) {
            console.log(error) // We shouldn't need to send this to the user. Hense no callback.
        }
    }
}
