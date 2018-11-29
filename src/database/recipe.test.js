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

test('Load a recipe for editing as the owner', done => {
    database.recipe.edit({ id: 0, name: 'James' }, 1, (err, recipe) => {
        expect(err).toBe(null)
        expect(recipe).toEqual({
            recipe: {
                id: 1,
                title: 'Lasagna',
                description: 'Great tasting lasagna',
                ingredients: 'Mince beef, Pasta slices, Cheese sauce',
                steps: [ { description: 'This is an example step with an image.' }, { description: 'This is an example step without an image.' } ]
            },
            published: 1
        })
        done()
    })
})

test('Load a recipe for editing as a different user than the owener', done => {
    database.recipe.edit({ id: 3, name: 'Martha' }, 1, (err, recipe) => {
        expect(err.message).toEqual('You don not have permission to edit this recipe')
        expect(recipe).toBe(undefined)
        done()
    })
})

test('Attempt to edit a recipe that does not exist', done => {
    database.recipe.edit({ id: 0, name: 'James' }, 999999, (err, recipe) => {
        expect(err.message).toEqual('Requested recipe does not exist')
        expect(recipe).toBe(undefined)
        done()
    })
})

test('Load a recipe', done => {
    database.recipe.load({ id: 0, name: 'James' }, 0, (err, recipe) => {
        expect(err).toBe(null)

        // We can't just test the whole recipe since it is updated everytime we view it
        expect(recipe.id).toEqual(0)
        expect(recipe.createdBy).toEqual(3)
        expect(recipe.title).toEqual('Shortbread')
        expect(recipe.image).toEqual('public/images/uploads/35138f1d2693144aa14e1dd9040b9f7b')
        expect(recipe.ingredients).toEqual('Butter, Flour')
        expect(recipe.description).toEqual('Crispy shortbread')
        expect(recipe.steps).toEqual('[{"description":"This is an example step without an image."},{"image":"public/images/uploads/4e619e04b43f5d4727f13a0df16b3ab7","description":"This is another example step but with an image."}]')
        expect(recipe.liked).toEqual(true)
        expect(recipe.likes).toEqual(2)
        expect(recipe.reported).toEqual(0)
        expect(recipe.comments).toEqual('[{"id":1,"createdBy":"Jess","createdOn":1543412764,"recipeId":0,"comment":"I made this and it tasted great!","parent":null}]')

        done()
    })
})

test('Attempt to load a recipe that does not exist', done => {
    database.recipe.load({ id: 0, name: 'James' }, 999999, (err, recipe) => {
        expect(err.message).toEqual('Requested recipe does not exist')
        expect(recipe).toBe(undefined)
        done()
    })
})

test('Fetch the recent recipes', done => {
    database.recipe.recent((err, recipes) => {
        expect(err).toBe(null)
        expect(recipes).toEqual([
            { id: 3,
              title: 'Apple Crumble',
              image: 'public/images/uploads/12cd2734b476c7005769bb3b5676ae9d',
              description: 'Crumbly and tasty' },
            { id: 2,
              title: 'Spaghetti Bolognese',
              image: 'public/images/uploads/d8efdbc79ca1b5d91b398f1dc247a9a7',
              description: 'Messy to eat; takes great' },
            { id: 1,
              title: 'Lasagna',
              image: 'public/images/uploads/65fa7d7199e93aa38f3bb009836a8a9e',
              description: 'Great tasting lasagna' },
            { id: 0,
              title: 'Shortbread',
              image: 'public/images/uploads/35138f1d2693144aa14e1dd9040b9f7b',
              description: 'Crispy shortbread' }
        ])

        done()
    })
})

test('Fetch the top recipes', done => {
    database.recipe.top((err, recipes) => {
        expect(err).toBe(null)
        expect(recipes).toEqual([
            { id: 0,
              title: 'Shortbread',
              image: 'public/images/uploads/35138f1d2693144aa14e1dd9040b9f7b',
              description: 'Crispy shortbread' },
            { id: 1,
              title: 'Lasagna',
              image: 'public/images/uploads/65fa7d7199e93aa38f3bb009836a8a9e',
              description: 'Great tasting lasagna' },
            { id: 2,
              title: 'Spaghetti Bolognese',
              image: 'public/images/uploads/d8efdbc79ca1b5d91b398f1dc247a9a7',
              description: 'Messy to eat; takes great' },
            { id: 3,
              title: 'Apple Crumble',
              image: 'public/images/uploads/12cd2734b476c7005769bb3b5676ae9d',
              description: 'Crumbly and tasty' }
        ])

        done()
    })
})

test('Test searching for a recipe', done => {
    database.recipe.search('Shortbread', (err, recipes) => {
        expect(err).toBe(null)
        expect(recipes).toEqual([
            { id: 0,
              title: 'Shortbread',
              image: 'public/images/uploads/35138f1d2693144aa14e1dd9040b9f7b',
              description: 'Crispy shortbread'},
            { id: 4,
              title: 'Shortbread',
              image: 'public/images/uploads/7c0e650a998d91eaebcf2ea9f85f7242',
              description: 'Crispy shortbread'}
        ])

        done()
    })
})

test('Ensure that we can get the users recipes', done => {
    database.recipe.user(0, (err, recipes) => {
        expect(err).toBe(null)
        expect(recipes)
        done()
    })
})

test('Ensure that we can get the users liked recipes', done => {
    database.recipe.liked(0, (err, recipes) => {
        expect(err).toBe(null)
        expect(recipes)
        done()
    })
})

test('Test reporting a recipe', done => {
    const db = new sqlite(config.database.name)
    const originalState = db.prepare('select * from recipes where id = 0').get()

    database.recipe.report(0)

    const newState = db.prepare('select * from recipes where id = 0').get()

    expect(Boolean(originalState.reported)).toEqual(!Boolean(newState.reported))

    db.prepare('update recipes set reported = ? where id = 0').run(originalState.reported)

    done()
})

test('Test liking a recipe', done => {
    const db = new sqlite(config.database.name)
    const originalUserState = db.prepare('select * from users where id = 3').get()
    const originalRecipeState = db.prepare('select * from recipes where id = 0').get()

    database.recipe.like({ id: 3, name: 'Martha' }, 0)

    const newUserState = db.prepare('select * from users where id = 3').get()
    const newRecipeState = db.prepare('select * from recipes where id = 0').get()

    expect(newUserState.likedRecipes).toEqual(JSON.stringify(JSON.parse(originalUserState.likedRecipes).concat(["0"])))
    expect(newRecipeState.likeRating).toEqual(originalRecipeState.likeRating + 1)

    db.prepare('update users set likedRecipes = ? where id = 3').run(originalUserState.likedRecipes)
    db.prepare('update recipes set likeRating = ? where id = 0').run(originalRecipeState.likeRating)

    done()
})

test('Test unliking a recipe', done => {
    const db = new sqlite(config.database.name)
    const originalUserState = db.prepare('select * from users where id = 2').get()
    const originalRecipeState = db.prepare('select * from recipes where id = 0').get()

    database.recipe.unlike({ id: 2, name: 'Jess' }, 0)

    const newUserState = db.prepare('select * from users where id = 2').get()
    const newRecipeState = db.prepare('select * from recipes where id = 0').get()

    let newLikedRecipes = JSON.parse(originalUserState.likedRecipes)
    newLikedRecipes.splice(newLikedRecipes.indexOf(`${0}`), 1)

    expect(newUserState.likedRecipes).toEqual(JSON.stringify(newLikedRecipes))
    expect(newRecipeState.likeRating).toEqual(originalRecipeState.likeRating - 1)

    db.prepare('update users set likedRecipes = ? where id = 2').run(originalUserState.likedRecipes)
    db.prepare('update recipes set likeRating = ? where id = 0').run(originalRecipeState.likeRating)

    done()
})
