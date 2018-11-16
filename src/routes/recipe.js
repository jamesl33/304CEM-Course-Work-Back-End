'use strict'

const router = require('express').Router()

router.post('/save', (req, res) => {
    // TODO - Store the recipe in the database
})

router.post('/publish', (req, res) => {
    // TODO - Store the recipe in the database then publish
})

router.post('/unpublish', (req, res) => {
    // TODO - Toggle the publish column for the corresponding recipe
})

module.exports = router
