'use strict'

const router = require('express').Router()

const user = require('./user.js')
const recipe = require('./recipe.js')

router.use('/user', user)
router.use('/recipe', recipe)

module.exports = router
