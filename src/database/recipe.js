'use strict'

const sqlite = require('better-sqlite3')
const config = require('../config.json')

async function _save(user, recipe, publish) {
    try {
        await new Promise((resolve) => {
            const db = new sqlite(config.database.name)
            const previousId = db.prepare('select max(id) as previousId from recipes').get()
            const dbUser = db.prepare('select * from users where name = ?').get(user.name)

            db.prepare('insert into recipes values (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
                previousId.previousId !== null ? previousId.previousId + 1 : 0,
                dbUser.id,
                Math.floor(new Date() / 1000),
                recipe.title,
                recipe.image,
                recipe.ingredients,
                recipe.description,
                JSON.stringify(recipe.steps),
                publish ? 1 : 0
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
    edit: async(user, id, done) => {
        try {
            const recipe = await new Promise((resolve, reject) => {
                const db = new sqlite(config.database.name)
                const dbRecipe = db.prepare('select * from recipes where id = ?').get(id)
                const dbUser = db.prepare('select * from users where name = ?').get(user.name)

                if (!dbRecipe) {
                    return reject(new Error('Requested recipe does not exit'))
                }

                if (!dbUser) {
                    return reject(new Error('Could not find user'))
                }

                if (dbRecipe.id !== dbUser.id) {
                    return reject(new Error('You don not have permission to edit this recipe'))
                }

                db.close()

                resolve({
                    recipe: {
                        id: dbRecipe.id,
                        title: dbRecipe.title,
                        description: dbRecipe.description,
                        ingredients: dbRecipe.ingredients,
                        steps: JSON.parse(dbRecipe.steps).map(step => {
                            delete step.image
                            return step
                        })
                    },
                    published: dbRecipe.published
                })
            })

            return done(null, recipe)
        } catch (error) {
            return done(error)
        }
    },
    publish: (user, recipe) => {
        return _save(user, recipe, true)
    },
    update: async(user, recipe, done) => {
        function newSteps(originalSteps, newSteps) {
            for (let i = 0; i < newSteps.length; i++) {
                if (newSteps[i].image === undefined) {
                    newSteps[i].image = originalSteps[i].image
                }
            }

            return JSON.stringify(newSteps)
        }

        try {
            await new Promise((resolve, reject) => {
                const db = new sqlite(config.database.name)
                const dbRecipe = db.prepare('select * from recipes where id = ?').get(recipe.id)
                const dbUser = db.prepare('select * from users where name = ?').get(user.name)

                if (!dbRecipe) {
                    return reject(new Error('Requested recipe does not exit'))
                }

                if (!dbUser) {
                    return reject(new Error('Could not find user'))
                }

                if (dbRecipe.id !== dbUser.id) {
                    return reject(new Error('You don not have permission to edit this recipe'))
                }

                Object.keys(recipe).forEach(key => {
                    if (key == 'steps') {
                        if (dbRecipe[key] != JSON.stringify(recipe[key])) {
                            db.prepare('update recipes set steps = ? where id = ?').run(newSteps(JSON.parse(dbRecipe[key]), recipe[key]), recipe.id)
                        }
                    } else {
                        if (dbRecipe[key] != recipe[key]) {
                            // Do this in a more verbose way to avoid possible SQL injection attacks
                            if (key === 'title') {
                                db.prepare(`update recipes set title = ? where id = ?`).run(recipe[key], recipe.id)
                            } else if (key === 'description') {
                                db.prepare(`update recipes set description = ? where id = ?`).run(recipe[key], recipe.id)
                            } else if (key === 'ingredients') {
                                db.prepare(`update recipes set ingredients = ? where id = ?`).run(recipe[key], recipe.id)
                            } else if (key === 'image') {
                                db.prepare(`update recipes set image = ? where id = ?`).run(recipe[key], recipe.id)
                            }
                        }
                    }
                })

                db.close()

                resolve()
            })

            done(null)
        } catch (error) {
            done(error)
        }
    },
    togglePublished: async(user, id, done) => {
        try {
            await new Promise((resolve) => {
                const db = new sqlite(config.database.name)
                const dbUser = db.prepare('select * from users where name = ?').get(user.name)
                const dbRecipe = db.prepare('select * from recipes where id = ?').get(id)

                if (dbRecipe.createdBy == dbUser.id) {
                    db.prepare('update recipes set published = not published where id = ?').run(id)
                } else {
                    reject(new Error('You do not own this recipe'))
                }

                db.close()

                resolve()
            })

            done(null)
        } catch (error) {
            done(error)
        }
    },
    load: async(user, id, done) => {
        try {
            const recipe = await new Promise((resolve, reject) => {
                const db = new sqlite(config.database.name)
                const dbUser = db.prepare('select * from users where name = ?').get(user.name)
                const dbRecipe = db.prepare('select * from recipes where id = ?').get(id)

                if (!dbRecipe) {
                    return reject(new Error('Requested recipe does not exit'))
                }

                if (!dbRecipe.published && dbUser.id != dbRecipe.createdBy) {
                    return reject(new Error('Requested recipe does not exit'))
                }

                resolve({
                    id: dbRecipe.id,
                    title: dbRecipe.title,
                    image: dbRecipe.image,
                    ingredients: dbRecipe.ingredients,
                    description: dbRecipe.description,
                    steps: dbRecipe.steps
                })
            })

            done(null, recipe)
        } catch (error) {
            done(error)
        }
    },
    recent: async(done) => {
        try {
            const recipes = await new Promise((resolve, reject) => {
                const db = new sqlite(config.database.name)
                const dbRecipes = db.prepare('select * from recipes where published = 1 order by createdOn desc').all()

                const recipes = []

                dbRecipes.forEach(recipe => {
                    recipes.push({
                        id: recipe.id,
                        title: recipe.title,
                        image: recipe.image,
                        description: recipe.description
                    })
                })

                resolve(recipes)

                db.close()
            })

            done(null, recipes)
        } catch (error) {
            done(error)
        }
    },
    top: async(done) => {
        try {
            const recipes = await new Promise((resolve, reject) => {
                // TODO - Add ratings to recipes
                // TODO - Implement this feature

            })

            done(null, recipes)
        } catch (error) {
            done(error)
        }
    }
}
