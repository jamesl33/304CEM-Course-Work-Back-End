#!/usr/bin/env node

'use-strict'

const express = require('express');

const app = express();

const listener = app.listen(8080, () => {
    console.log('Server is listening on port ' + listener.address().port)
});
