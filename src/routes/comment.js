/**
 * @module routes:comments
 */

'use strict'

const database = require('../database')
const passport = require('passport')
const router = require('express').Router()

/**
 * @name comment
 * @description Post a new comment on a recipe
 * @route {POST} /comment
 * @headerparam {String} authorization - The JWT provided when the user logged in
 * @bodyparam {Integer} id - The id of the recipe that is being commented on
 * @bodyparam {String} comment - The body of the comment
 */
router.post('/comment', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                // The user isn't logged in therefore can't create a comment
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            database.comments.comment(user, req.body)
            // Notify the user that the resource was created successfully
            res.status(201).send()
        }
    })(req, res)
})

module.exports = router
