'use strict'

const sqlite = require('better-sqlite3')
const config = require('../config.json')

async function _save(user, recipe, publish) {
    try {
        await new Promise((resolve) => {
            const db = new sqlite(config.database.name)
            const previousId = db.prepare('select max(id) as previousId from recipes').get()
            const dbUser = db.prepare('select * from users where name = ?').get(user.name)

            db.prepare('insert into recipes values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
                previousId.previousId !== null ? previousId.previousId + 1 : 0,
                dbUser.id,
                Math.floor(new Date() / 1000),
                recipe.title,
                recipe.image,
                recipe.ingredients,
                recipe.description,
                JSON.stringify(recipe.steps),
                publish ? 1 : 0,
                0, // likeRating
                0, // reported
                0 // viewCount
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
                                db.prepare('update recipes set title = ? where id = ?').run(recipe[key], recipe.id)
                            } else if (key === 'description') {
                                db.prepare('update recipes set description = ? where id = ?').run(recipe[key], recipe.id)
                            } else if (key === 'ingredients') {
                                db.prepare('update recipes set ingredients = ? where id = ?').run(recipe[key], recipe.id)
                            } else if (key === 'image') {
                                db.prepare('update recipes set image = ? where id = ?').run(recipe[key], recipe.id)
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
            await new Promise((resolve, reject) => {
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
                const comments = db.prepare('select * from comments where recipeId = ?').all(id)

                comments.map(comment => {
                    // This could propably be done in the sql statement; I just don't know how
                    comment.createdBy = db.prepare('select name from users where id = ?').get(comment.createdBy).name
                })

                if (!dbRecipe) {
                    return reject(new Error('Requested recipe does not exit'))
                }

                if (!dbRecipe.published && dbUser.id != dbRecipe.createdBy) {
                    return reject(new Error('Requested recipe does not exit'))
                }

                db.prepare('update recipes set viewCount = viewCount + 1 where id = ?').run(id) // Increment the view counter

                resolve({
                    id: dbRecipe.id,
                    title: dbRecipe.title,
                    image: dbRecipe.image,
                    ingredients: dbRecipe.ingredients,
                    description: dbRecipe.description,
                    steps: dbRecipe.steps,
                    liked: dbUser ? JSON.parse(dbUser.likedRecipes).includes(id) : undefined,
                    likes: dbRecipe.likeRating,
                    reported: dbRecipe.reported,
                    views: dbRecipe.viewCount + 1, // Add one because this row was collected before we incremented the viewCount column
                    comments: JSON.stringify(comments)
                })
            })

            done(null, recipe)
        } catch (error) {
            done(error)
        }
    },
    recent: async(done) => {
        try {
            const recipes = await new Promise((resolve) => {
                const db = new sqlite(config.database.name)
                const dbRecipes = db.prepare('select * from recipes where published = 1 order by createdOn desc limit 5').all()

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
            const recipes = await new Promise((resolve) => {
                const db = new sqlite(config.database.name)
                const dbRecipes = db.prepare('select * from recipes where published = 1 order by likeRating desc limit 5').all()

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
    like: async(user, id, done) => {
        try {
            await new Promise((resolve) => {
                const db = new sqlite(config.database.name)
                const dbUser = db.prepare('select * from users where name = ?').get(user.name)

                db.prepare('update recipes set likeRating = likeRating + 1 where id = ?').run(id)
                db.prepare('update users set likedRecipes = ? where id = ?').run(JSON.stringify(JSON.parse(dbUser.likedRecipes).concat([id])), dbUser.id)

                db.close()

                resolve()
            })

            done(null)
        } catch (error) {
            done(error)
        }
    },
    unlike: async(user, id, done) => {
        try {
            await new Promise((resolve) => {
                const db = new sqlite(config.database.name)
                const dbUser = db.prepare('select * from users where name = ?').get(user.name)

                db.prepare('update recipes set likeRating = likeRating - 1 where id = ?').run(id)

                let newLikedRecipes = JSON.parse(dbUser.likedRecipes)
                const index = newLikedRecipes.indexOf(`${id}`)

                if (index !== -1) {
                    newLikedRecipes.splice(index, 1)
                }

                db.prepare('update users set likedRecipes = ? where id = ?').run(JSON.stringify(newLikedRecipes), dbUser.id)

                db.close()

                resolve()
            })

            done(null)
        } catch (error) {
            done(error)
        }
    },
    report: async(user, id, done) => {
        try {
            await new Promise((resolve) => {
                const db = new sqlite(config.database.name)

                db.prepare('update recipes set reported = 1 where id = ?').run(id)

                db.close()

                resolve()
            })

            done(null)
        } catch (error) {
            done(error)
        }
    },
    search: async(query, done) => {
        try {
            const results = await new Promise((resolve) => {
                const db = new sqlite(config.database.name)
                const titleResults = db.prepare('select * from recipes where title like ?').all(query)
                const descriptionResults = db.prepare('select * from recipes where description like ?').all(query)
                const ingredientsResults = db.prepare('select * from recipes where ingredients like ?').all(query)

                db.close()

                // Remove any duplicates from the search results
                let recipes = [].concat(titleResults, descriptionResults, ingredientsResults)
                let uniqueRecipes = []

                recipes.forEach(recipe => {
                    if (!(recipe in uniqueRecipes)) {
                        uniqueRecipes.push(recipe)
                    }
                })

                resolve(recipes)
            })

            done(null, results)
        } catch (error) {
            done(error)
        }
    },
    user: async(id, done) => {
        try {
            const recipes = await new Promise((resolve) => {
                const db = new sqlite(config.database.name)
                let dbRecipes = db.prepare('select * from recipes where createdBy = ?').all(id)

                if (dbRecipes) {
                    dbRecipes = dbRecipes.sort(() => .5 - Math.random()) // Shuffle the users recipes
                    dbRecipes = dbRecipes.slice(0, 5) // Show the user 5 random recipes which they created
                }

                db.close()

                resolve(dbRecipes)
            })

            done(null, recipes)
        } catch (error) {
            done(error)
        }
    },
    liked: async(id, done) => {
        try {
            const recipes = await new Promise((resolve) => {
                const db = new sqlite(config.database.name)
                const likedRecipes = db.prepare('select likedRecipes from users where id = ?').get(id)

                let recipeList = []

                if (likedRecipes.likedRecipes) {
                    let recipes = JSON.parse(likedRecipes.likedRecipes)
                    recipes = recipes.sort(() => .5 - Math.random()) // Shuffle the liked list
                    recipes = recipes.slice(0, 5) // Get the first five recipe id's

                    recipes.forEach(recipeId => {
                        let recipe = db.prepare('select * from recipes where id = ? and published = 1').get(recipeId)

                        if (recipe) {
                            recipeList.push(recipe)
                        }
                    })
                }

                db.close()

                resolve(recipeList)
            })

            done(null, recipes)
        } catch (error) {
            done(error)
        }
    }
}
