const database = require('../database')
const passport = require('passport')
const router = require('express').Router()

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
