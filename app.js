'use strict';

//Filen app.js är den enda ni skall och tillåts skriva kod i.

const express = require('express');
const jsDOM = require('jsdom');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const globalObject = require('./servermodules/game-modul');

let app = express();

app.listen(3000, () => {
    console.log('server up and running');
    //testar git commands
});






