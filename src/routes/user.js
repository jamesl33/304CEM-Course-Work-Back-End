'use strict'

const router = require('express').Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const database = require('../database')
const config = require('../config.json')

require('../middleware/passport.js')

router.post('/login', (req, res) => {
    passport.authenticate('local', (err, user) => {
        if (err) {
            res.status(401).send({
                message: err.message
            })
        } else {
            res.send(Object.assign({}, user, {
                token: jwt.sign(user, config.jwt.jwtSecret)
            }))
        }
    })(req, res)
})

router.post('/register', (req, res) => {
    if (req.body.username && req.body.name && req.body.password && req.body.email) {
        database.addUser(req.body, (err, user) => {
            if (err) {
                res.status(401).send({
                    message: err.message
                })
            } else {
                res.send(Object.assign({}, user, {
                    token: jwt.sign(user, config.jwt.jwtSecret)
                }))
            }
        })
    }
})

module.exports = router
