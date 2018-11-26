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

router.post('/recent', (req, res) => {
    // Since this is for the home page we don't need to authenticate
    database.recipe.recent((err, recipes) => {
        if (err) {
            res.status(403).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            res.send(recipes)
        }
    })
})

router.post('/top', (req, res) => {
    // Since this is for the home page we don't need to authenticate
    database.recipe.top((err, recipes) => {
        if (err) {
            res.status(403).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            res.send(recipes)
        }
    })
})

router.post('/like', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            database.recipe.like(user, req.body.id, (err) => {
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

router.post('/unlike', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            database.recipe.unlike(user, req.body.id, (err) => {
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

router.post('/report', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            database.recipe.report(user, req.body.id, (err) => {
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

module.exports = router
