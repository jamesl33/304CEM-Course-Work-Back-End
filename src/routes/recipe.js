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

    const steps = JSON.parse(body.steps)

    for (let i = 0; i < steps.length; i++) {
        recipe.steps.push({
            image: steps[i].image ? files[i].path : undefined, // I need to support optional images per step
            description: steps[i].description
        })
    }

    return recipe
}

router.post('/save', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err) {
            res.status(401).send({
                message: err.message
            })
        } else {
            database.recipe.save(user, _formDataToRecipe(req.body, req.files))
            res.status(200).send() // Notify that the recipe was saved correctly
        }
    })(req, res)
})

router.post('/publish', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err) {
            res.status(401).send({
                message: err.message
            })
        } else {

            // database.recipe.togglePublished({id: 1})

            database.recipe.publish(user, _formDataToRecipe(req.body, req.files))
            res.status(200).send() // Notify that the recipe was published correctly
            // TODO - Redirect the user to the publish recipe
        }
    })(req, res)
})

router.post('/publish/toggle', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err) {
            res.status(401).end({
                message: err.message
            })
        } else {
            database.recipe.togglePublished(user, _formDataToRecipe(req.body, req.files))
            res.status(200).send() // Notify that the recipe was published/unpublished correctly
        }
    })(req, res)
})

module.exports = router
