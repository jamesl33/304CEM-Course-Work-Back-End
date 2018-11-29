/**
 * @module database:comments
 */

'use strict'

const sqlite = require('better-sqlite3')
const config = require('../config.json')

module.exports = {
    /**
     * @description Add a comment to the comments table
     * @param {Object} user - The user that posted the comment; should be obtained from passport
     * @param {Object} comment - The comments itself. Will contain the comment body and who posted it.
     */
    comment: async(user, comment) => {
        await new Promise((resolve) => {
            const db = new sqlite(config.database.name)
            const dbUser = db.prepare('select * from users where name = ?').get(user.name)
            const previousId = db.prepare('select max(id) as previousId from comments').get()

            db.prepare('insert into comments values (?, ?, ?, ?, ?, ?)').run(
                previousId.previousId !== null ? previousId.previousId + 1 : 0,
                dbUser.id,
                Math.floor(new Date() / 1000),
                comment.recipeId,
                comment.comment,
                comment.parent ? comment.parent : null
            )

            db.close()

            resolve()
        })
    }
}
