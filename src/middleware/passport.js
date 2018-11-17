'use strict'

const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;
const LocalStrategy = require('passport-local').Strategy
const passport = require('passport')
const database = require('../database')
const config = require('../config.json')

passport.use(new LocalStrategy((username, password, done) => {
    database.user.verify({ username: username, password: password }, (err, result) => {
        if (err) {
            done(err)
        } else {
            done(null, result)
        }
    })
}))

passport.use(new JWTStrategy({jwtFromRequest: ExtractJWT.fromHeader('authorization'), secretOrKey: config.jwt.jwtSecret, session: false}, (user, done) => {
    done(null, user)
}))
