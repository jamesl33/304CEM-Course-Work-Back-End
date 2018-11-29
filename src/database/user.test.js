const config = require('../config.json')
const database = require('../database')
const sqlite = require('better-sqlite3')

config.database.name = 'RecipeBlog.test.sqlite3' // Use the test database

test('Login as James with the correct password', done => {
    database.user.verify({ username: 'James', password: 'happy man' }, (err, user) => {
        expect(err).toEqual(null)
        expect(user).toEqual({ id: 0, name: 'James' })
        done()
    })
})

test('Login as James with the wrong password', done => {
    database.user.verify({ username: 'James', password: 'unhappy man' }, (err, user) => {
        expect(err.message).toEqual('Incorrect password')
        expect(user).toBe(undefined)
        done()
    })
})

test('Login where the user has not registered an account yet', done => {
    database.user.verify({ username: 'John', password: 'password' }, (err, user) => {
        expect(err.message).toEqual('Could not find user, are you sure you have an account?')
        expect(user).toBe(undefined)
        done()
    })
})

test('Register a new user', done => {
    database.user.add({ username: 'Trevor', name: 'Trevor', email: 'trevor@example-email.com', password: 'f*ck De Santa' }, (err, user) => {
        expect(err).toBe(null)
        expect(user).toEqual({ id: 4, name: 'Trevor' })

        // Remove the user that we just added
        const db = new sqlite(config.database.name)
        db.prepare('delete from users where username = ?').run('Trevor')

        done()
    })
})

test('Register name already taken', done => {
    database.user.add({ username: 'James', name: 'James', email: 'james@example-email.com', password: 'happy man' }, (err, user) => {
        expect(err.message).toEqual('Username already taken')
        expect(user).toBe(undefined)
        done()
    })
})

test('Access a user profile', done => {
    database.user.profile(0, false, (err, user) => {
        expect(err).toBe(null)
        expect(user.name).toEqual('James')
        expect(user.recipes.length).toEqual(1) // We don't need to test the content of the recipes
        done()
    })
})

test('Access a user profile', done => {
    database.user.profile(0, true, (err, user) => {
        expect(err).toBe(null)
        expect(user.name).toEqual('James')
        expect(user.recipes.length).toEqual(2) // We don't need to test the content of the recipes
        done()
    })
})
