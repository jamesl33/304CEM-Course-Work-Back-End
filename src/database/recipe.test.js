const config = require('../config.json')
const database = require('../database')
const sqlite = require('better-sqlite3')

config.database.name = 'RecipeBlog.test.sqlite3' // Use the test database

test('Test saving a recipe', done => {
    const user = {
        id: 0,
        name: 'James'
    }

    const newRecipe = {
        title: 'test',
        image: 'public/images/test.png', // not a real image; it doesn't matter as we only store the path
        ingredients: 'test',
        description: 'test',
        steps: [{image: 'test', description: 'test'}]
    }

    database.recipe.save(user, newRecipe)

    const db = new sqlite(config.database.name)
    const latestRecipe = db.prepare('select * from recipes where id = (select max(id) from recipes)').get()

    expect(latestRecipe).toEqual({
        id: latestRecipe.id,
        createdBy: 0,
        createdOn: latestRecipe.createdOn,
        title: 'test',
        image: 'public/images/test.png',
        ingredients: 'test',
        description: 'test',
        steps: JSON.stringify([{image: 'test', description: 'test'}]),
        published: 0,
        likeRating: 0,
        reported: 0,
        viewCount: 0
    })

    db.prepare('delete from recipes where id = (select max(id) from recipes)').run()

    db.close()

    done()
})

// This is almost identical to saving however published should be set to true
test('Test publishing a recipe', done => {
    const user = {
        id: 0,
        name: 'James'
    }

    const newRecipe = {
        title: 'test',
        image: 'public/images/test.png', // not a real image; it doesn't matter as we only store the path
        ingredients: 'test',
        description: 'test',
        steps: [{image: 'test', description: 'test'}]
    }

    database.recipe.publish(user, newRecipe)

    const db = new sqlite(config.database.name)
    const latestRecipe = db.prepare('select * from recipes where id = (select max(id) from recipes)').get()

    expect(latestRecipe).toEqual({
        id: latestRecipe.id,
        createdBy: 0,
        createdOn: latestRecipe.createdOn,
        title: 'test',
        image: 'public/images/test.png',
        ingredients: 'test',
        description: 'test',
        steps: JSON.stringify([{image: 'test', description: 'test'}]),
        published: 1,
        likeRating: 0,
        reported: 0,
        viewCount: 0
    })

    db.prepare('delete from recipes where id = (select max(id) from recipes)').run()

    db.close()

    done()
})
