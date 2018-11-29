'use strict'

const router = require('express').Router()

const user = require('./user.js')
const recipe = require('./recipe.js')
const comment = require('./comment.js')

router.use('/user', user)
router.use('/recipe', recipe)
router.use('/comment', comment)

module.exports = router
