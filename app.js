'use strict';

//Filen app.js är den enda ni skall och tillåts skriva kod i.

const express = require('express');
const jsDOM = require('jsdom');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const globalObject = require('./servermodules/game-modul');

let app = express();

let server = app.listen(3000, () => {
    console.log('server up and running');
    //testar git commands
});

app.use('/public', express.static(__dirname + '/static'));
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());

app.get('/', function(request, response){
    response.sendFile(__dirname + '/static/html/loggain.html', function(err){
        if(err){
            console.log('fel vid uppladdning av fil');
        }else{
            console.log('allt ok');
        }


    });
});

app.get('/reset', function(request, response){
    
});

app.post('/', function(request, response){
    
    
    let nick1 = request.body.nick_1;
    let color1 = request.body.color_1;
    
    try{
        //console.log('nickname saknas');
        if(nick1 === undefined){
            throw{
                errorMsg : 'Nickname saknas!'
                
            };
        }
        if(nick1.length < 3){
            throw{
                errorMsg : 'Nickname ska vara minst tre tecken långt!'
            };
        }
        if(color1 === undefined){
            throw{
                errorMsg : 'Färg saknas!'
            };
        }
        if(color1.length !== 7){
            throw{
                errorMsg : 'Färg ska innehålla sju tecken!'
            }
        }
        if(color1 === '#000000' || color1 === '#ffffff'){
            throw{
                errorMsg : 'Ogiltig färg'
            };
        }

        

        

    }catch(eo){
        
    }


    
});












