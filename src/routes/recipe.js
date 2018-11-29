/**
 * @module routes:recipe
 */

'use strict'

const database = require('../database')
const passport = require('passport')
const router = require('express').Router()

function _formDataToRecipe(body, files) {
    const recipe = {}

    Object.keys(body).forEach(key => {
        if (key === 'steps') {
            recipe.steps = []
        } else {
            recipe[key] = body[key]
        }
    })

    if (body.image) {
        recipe.image = files[0].path
        files.splice(0, 1)
    }

    const steps = JSON.parse(body.steps)

    for (let i = 0; i < steps.length; i++) {
        recipe.steps.push({
            image: steps[i].image ? files[0].path : undefined, // I need to support optional images per step
            description: steps[i].description
        })

        if (steps[i].image) {
            files.splice(0, 1)
        }
    }

    return recipe
}

/**
 * @name save
 * @description Save a recipe in the datebase
 * @route {POST} /save
 * @headerparam {String} authorization - The JWT provided when the user logged in
 * @bodyparam {String} steps - The recipes steps
 * @bodyparam {String} title - The chosen title
 * @bodyparam {Boolean} image - Indicates whether we should check for images in req.files
 * @bodyparam {String} description - The recipe description
 * @bodyparam {String} ingredients - The recipe ingredients
 */
router.post('/save', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            database.recipe.save(user, _formDataToRecipe(req.body, req.files))
            // Notify the user that the resource was created successfully
            res.status(201).send()
        }
    })(req, res)
})

/**
 * @name edit
 * @description Get a recipe in a from so that it can be edited
 * @route {POST} /edit
 * @headerparam {String} authorization - The JWT provided when the user logged in
 * @bodyparam {String} id - The id of the recipe the user is trying to edit
 */
router.post('/edit', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            database.recipe.edit(user, req.body.id, (err, recipe) => {
                if (err) {
                    // The user doesn't have access to this recipe or it doesn't exist
                    res.status(403).send({
                        message: err ? err.message : 'Unauthorized'
                    })
                } else {
                    res.send(recipe)
                }
            })
        }
    })(req, res)
})

/**
 * @name publish
 * @description Save a recipe in the database with the publised flag set
 * @route {POST} /publish
 * @headerparam {String} authorization - The JWT provided when the user logged in
 * @bodyparam {String} steps - The recipes steps
 * @bodyparam {String} title - The chosen title
 * @bodyparam {Boolean} image - Indicates whether we should check for images in req.files
 * @bodyparam {String} description - The recipe description
 * @bodyparam {String} ingredients - The recipe ingredients
 */
router.post('/publish', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            database.recipe.publish(user, _formDataToRecipe(req.body, req.files))
            // Notify the user that the resource was created successfully
            res.status(201).send()
        }
    })(req, res)
})

/**
 * @name update
 * @description Update a recipe in the database
 * @route {POST} /update
 * @headerparam {String} authorization - The JWT provided when the user logged in
 * @bodyparam {String} steps - The recipes steps
 * @bodyparam {String} title - The chosen title
 * @bodyparam {Boolean} image - Indicates whether we should check for images in req.files
 * @bodyparam {String} description - The recipe description
 * @bodyparam {String} ingredients - The recipe ingredients
 */
router.post('/update', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            database.recipe.update(user, _formDataToRecipe(req.body, req.files), (err) => {
                if (err) {
                    // The user doesn't have access to this recipe or it doesn't exist
                    res.status(403).send({
                        message: err.message
                    })
                } else {
                    // Notify the user that the resource was updated successfully
                    res.status(201).send()
                }
            })
        }
    })(req, res)
})

/**
 * @name togglePublished
 * @description Toggle the published flag for a recipe in the database
 * @route {POST} /publish/toggle
 * @headerparam {String} authorization - The JWT provided when the user logged in
 * @bodyparam {String} id - The id of the recipe which we want to operate on
 */
router.post('/publish/toggle', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            database.recipe.togglePublished(user, req.body.id, (err) => {
                if (err) {
                    res.status(401).send({
                        message: err.message
                    })
                } else {
                    // Notify the user that the resource was updated successfully
                    res.status(201).send()
                }
            })
        }
    })(req, res)
})

/**
 * @name load
 * @description Load a recipe so that it can be displayed
 * @route {POST} /load
 * @headerparam {String} authorization - The JWT provided when the user logged in
 * @bodyparam {String} id - The id of the recipe the user wants to view
 */
router.post('/load', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err) {
            console.log(err)
        }

        database.recipe.load(user, req.body.id, (err, recipe) => {
            if (err) {
                res.status(403).send({
                    message: err ? err.message : 'Unauthorized'
                })
            } else {
                res.send(recipe)
            }
        })
    })(req, res)
})

/**
 * @name recent
 * @description Load 5 of the most recent recipes
 * @route {POST} /recent
 */
router.post('/recent', (req, res) => {
    // Since this is for the home page we don't need to authenticate
    database.recipe.recent((recipes) => {
        res.send(recipes)
    })
})

/**
 * @name top
 * @description Get the top 5 rated recipes
 * @route {POST}
 */
router.post('/top', (req, res) => {
    // Since this is for the home page we don't need to authenticate
    database.recipe.top((recipes) => {
        res.send(recipes)
    })
})

/**
 * @name like
 * @description Like a recipe in the database
 * @route {POST} /like
 * @headerparam {String} authorization - The JWT provided when the user logged in
 * @bodyparam {String} id - The id of the recipe the user is liking
 */
router.post('/like', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            database.recipe.like(user, req.body.id)

            // Notify the user that the resource was updated successfully
            res.status(201).send()
        }
    })(req, res)
})

/**
 * @name unlike
 * @description Unlike a recipe in the database
 * @route {POST} /unlike
 * @headerparam {String} authorization - The JWT provided when the user logged in
 * @bodyparam {String} id - The id of the recipe the user is liking
 */
router.post('/unlike', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            database.recipe.unlike(user, req.body.id)

            // Notify the user that the resource was updated successfully
            res.status(201).send()
        }
    })(req, res)
})

/**
 * @name report
 * @description Mark a recipe as reported
 * @route {POST} /report
 * @bodyparam {String} id - The id of the recipe which is being reported
 */
router.post('/report', (req, res) => {
    database.recipe.report(req.body.id)

    // Notify the user that the resource was updated successfully
    res.status(201).send()
})

/**
 * @name search
 * @description Search the database for a recipe
 * @route {POST} /search
 * @bodyparam {String} query - The search query
 */
router.post('/search', (req, res) => {
    database.recipe.search(req.body.query, (results) => {
        res.send(results)
    })
})

/**
 * @name user
 * @description Get 5 random recipes created a specific user
 * @route {POST}
 * @bodyparam {String} id - The of of the user
 */
router.post('/user', (req, res) => {
    database.recipe.user(req.body.id, (recipes) => {
        res.send(recipes)
    })
})

/**
 * @name liked
 * @description Get 5 random recipes liked by a specific user
 * @route {POST}
 * @bodyparam {String} id - The id of the user
 */
router.post('/liked', (req, res) => {
    database.recipe.liked(req.body.id, (recipes) => {
        res.send(recipes)
    })
})

module.exports = router
