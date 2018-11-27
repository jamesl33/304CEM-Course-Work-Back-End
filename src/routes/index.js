'use strict'

const router = require('express').Router()

const user = require('./user.js')
const recipe = require('./recipe.js')
const comments = require('./comments.js')

router.use('/user', user)
router.use('/recipe', recipe)
router.use('/comments', comments)

module.exports = router
