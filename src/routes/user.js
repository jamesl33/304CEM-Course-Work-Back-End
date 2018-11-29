/**
 * @module routes:user
 */

'use strict'

const router = require('express').Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const database = require('../database')
const config = require('../config.json')

require('../middleware/passport.js')

/**
 * @name login
 * @description Authenticate a user then send back a JWT if successful
 * @route {POST} /login
 * @bodyparam {String} username - The username of the user trying to login
 * @bodyparam {String} password - The password of the user trying to login
 */
router.post('/login', (req, res) => {
    passport.authenticate('local', (err, user) => {
        if (err || user === false) {
            res.status(401).send({
                message: err ? err.message : 'Unauthorized'
            })
        } else {
            res.send(Object.assign({}, user, {
                token: jwt.sign(user, config.jwt.jwtSecret)
            }))
        }
    })(req, res)
})

/**
 * @name register
 * @description Allow a user to register an account
 * @route {POST} /register
 * @bodyparam {String} username - The users desired username
 * @bodyparam {String} name - The full name of the user
 * @bodyparam {String} password - The users chosen password
 * @bodyparam {String} email - The users chosen email
 */
router.post('/register', (req, res) => {
    if (req.body.username && req.body.name && req.body.password && req.body.email) {
        database.user.add(req.body, (err, user) => {
            if (err || user === false) {
                res.status(401).send({
                    message: err ? err.message : 'Unauthorized'
                })
            } else {
                res.send(Object.assign({}, user, {
                    token: jwt.sign(user, config.jwt.jwtSecret)
                }))
            }
        })
    }
})

/**
 * @name profile
 * @description Fetch a users profile
 * @route {POST} /profile
 * @headerparam {String} authorization - The JWT provided when the user logged in
 * @bodyparam {Integer} id - The if of the users profile that you want to fetch
 */
router.post('/profile', (req, res) => {
    passport.authenticate('jwt', (err, user) => {
        if (err || user === false) {
            database.user.profile(req.body.id, false, (err, profile) => {
                if (err) {
                    console.log(err)
                } else {
                    res.send(profile)
                }
            })
        } else {
            database.user.profile(req.body.id, true, (err, profile) => {
                if (err) {
                    console.log(err)
                } else {
                    res.send(profile)
                }
            })
        }
    })(req, res)
})

module.exports = router
