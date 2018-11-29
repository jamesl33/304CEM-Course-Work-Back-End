const database = require('../database')
const sqlite = require('better-sqlite3')
const fs = require('fs')

test('Test database creation', done => {
    try {
        database.createDatabase('TestDataBaseCreation.sqlite3')

        const db = new sqlite('TestDataBaseCreation.sqlite3')
        const tables = db.prepare('select name from sqlite_master where type="table"').all()

        expect(tables).toEqual([
            {name: 'users'},
            {name: 'recipes'},
            {name: 'comments'}
        ])

        // TODO - Test that the columns that are created are correct as well
    } finally {
        fs.unlinkSync('TestDataBaseCreation.sqlite3')
        done()
    }
})
