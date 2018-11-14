#!/usr/bin/env node

'use strict'

const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express');
const passport = require('passport')
const config = require('./src/config.json')

const app = express();

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(passport.initialize())

app.use(express.static('./public'))

const routes = (require('./src/routes'))

app.use('/', routes)

const server = app.listen(config.server.port, () => {
    console.log('Server is listening on port ' + server.address().port)
});
