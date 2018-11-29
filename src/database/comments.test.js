const config = require('../config.json')
const database = require('../database')
const sqlite = require('better-sqlite3')

config.database.name = 'RecipeBlog.test.sqlite3' // Use the test database

test('Test posting a new comment', done => {
    database.comments.comment({ id: 0, name: 'James' }, { recipeId: 0, comment: 'test comment', parent: null })

    const db = new sqlite(config.database.name)
    const latestComment = db.prepare('select * from comments where id = (select max(id) from comments)').get()

    expect(latestComment).toEqual({
        id: latestComment.id,
        createdBy: 0,
        createdOn: latestComment.createdOn,
        parent: null,
        recipeId: 0,
        comment: 'test comment'
    })

    db.prepare('delete from comments where id = (select max(id) from comments)').run()

    done()
})
