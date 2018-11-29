const config = require('../config.json')
const database = require('../database')
const sqlite = require('better-sqlite3')

config.database.name = 'RecipeBlog.test.sqlite3' // Use the test database

test('Login as James with the correct password', done => {
    function callback(err, user) {
        expect(err).toEqual(null)
        expect(user).toEqual({ id: 0, name: 'James' })
        done()
    }

    database.user.verify({ username: 'James', password: 'happy man' }, callback)
})

test('Login as James with the wrong password', done => {
    function callback(err, user) {
        expect(err.message).toEqual('Incorrect password')
        expect(user).toBe(undefined)
        done()
    }

    database.user.verify({ username: 'James', password: 'unhappy man' }, callback)
})

test('Login where the user has not registered an account yet', done => {
    function callback(err, user) {
        expect(err.message).toEqual('Could not find user, are you sure you have an account?')
        expect(user).toBe(undefined)
        done()
    }

    database.user.verify({ username: 'John', password: 'password' }, callback)
})

test('Register a new user', done => {
    function callback(err, user) {
        expect(err).toBe(null)
        expect(user).toEqual({ id: 4, name: 'Trevor' })

        // Remove the user that we just added
        const db = new sqlite(config.database.name)
        db.prepare('delete from users where username = ?').run('Trevor')

        done()
    }

    database.user.add({ username: 'Trevor', name: 'Trevor', email: 'trevor@example-email.com', password: 'f*ck De Santa' }, callback)
})

test('Register name already taken', done => {
    function callback(err, user) {
        expect(err.message).toEqual('Username already taken')
        expect(user).toBe(undefined)
        done()
    }

    database.user.add({ username: 'James', name: 'James', email: 'james@example-email.com', password: 'happy man' }, callback)
})

test('Access a user profile', done => {
    function callback(err, user) {
        expect(err).toBe(null)
        expect(user.name).toEqual('James')
        expect(user.recipes.length).toEqual(1) // We don't need to test the content of the recipes
        done()
    }

    database.user.profile(0, false, callback)
})

test('Access a user profile', done => {
    function callback(err, user) {
        expect(err).toBe(null)
        expect(user.name).toEqual('James')
        expect(user.recipes.length).toEqual(2) // We don't need to test the content of the recipes
        done()
    }

    database.user.profile(0, true, callback)
})
