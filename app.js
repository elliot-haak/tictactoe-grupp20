'use strict';

//Filen app.js är den enda ni skall och tillåts skriva kod i.
//all kod är tagen från workshop och föreläsning 4 med Peter github

//här importerar vi alla paket som vi har installerat via npm 
const express = require('express');
const jsDOM = require('jsdom');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const globalObject = require('./servermodules/game-modul.js');

let app = express();
//skapar server på port 3000
let server = app.listen(3000, () => {
    console.log('server up and running');
});
//alla middleware för public folder som inte finns och byter ut den mot static, cookies och så serverkan läsa datan med urlencoded
app.use('/public', express.static(__dirname + '/static'));
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());

//get metod på rooten där den vi kontrollerar om det finns cookies på servern och om det finns så skickar vi index filen annars så skickar vi loggain filen
app.get('/', function(request, response){
    let nickname = request.cookies.nickName;
    let color = request.cookies.color;

    if(nickname !== undefined && color !==undefined){
      response.sendFile(__dirname + '/static/html/index.html', function(err){
        if(err){
            console.log('fel vid uppladdning av fil');
        }else{
            console.log('allt ok');
        }
    });

    }else{

      response.sendFile(__dirname + '/static/html/loggain.html', function(err){
        if(err){
            console.log('fel vid uppladdning av fil');
        }else{
            console.log('allt ok');
        }
    });

    }
        
});

//på sökvägen /reset hämtar vi cookies och om dem finns så tar vi bort dem och rensar värdena på globalobject attributen och skickar tillbaka användaren till rooten oavsett 
app.get('/reset', function(request, response){
   let nickname = request.cookies.nickName;
   let color = request.cookies.color;

  if(nickname !== undefined && color !== undefined){
    response.clearCookie('nickName');
    response.clearCookie('color');

    globalObject.playerOneNick = null;
    globalObject.playerTwoNick = null;
    globalObject.playerOneColor = null; 
    globalObject.playerTwoColor = null; 
  }

  response.redirect('/');
});

//på metod post på rooten (när man klickar på submit knappen) så hämtar vi värdena i input fälten
//Validerar värdena och sparar värdet till spelare 1 eller 2 beroende på om playerOneNick är satt eller inte
//Om allt är ok så skapar vi kakor och skickar användaren till rooten
//vid undantag så läser vi in loggain filen skapar den virtuella DOMen och hämtar element
//Sätter text på #errorMsg med det fel som fångas i try
app.post('/', function(request, response){
    
    
    let nick1 = request.body.nick_1;
    let color1 = request.body.color_1;
    
    try{
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
      if(globalObject.playerOneNick !== null && globalObject.playerOneColor !== null){
        globalObject.playerTwoNick = nick1; 
        globalObject.playerTwoColor = color1; 

        if(globalObject.playerTwoNick === globalObject.playerOneNick){
          throw{
            errorMsg : 'Nickname redan valt'
          }
        }
        if(globalObject.playerTwoColor === globalObject.playerOneColor){
          throw{
            errorMsg : 'Färg redan valt'
          }
        }
      }else{
        globalObject.playerOneNick = nick1;
        globalObject.playerOneColor = color1; 
      }      

            
        

      response.cookie('nickName', nick1, {maxAge : 2 * 60 * 60 * 1000});
      response.cookie('color', color1, {maxAge : 2* 60 * 60 * 1000});

      response.redirect("/"); 

    }catch(eo){
     fs.readFile(__dirname + '/static/html/loggain.html',  function(err, data){
       if(err){
         console.log('kunde inte läsa in fil');
       }else{
         let serverDOM = new jsDOM.JSDOM(data);
          
         serverDOM.window.document.querySelector('#errorMsg').textContent = eo.errorMsg;
         serverDOM.window.document.querySelector('#nick_1').value = nick1;
         serverDOM.window.document.querySelector('#color_1').value = color1; 

         data = serverDOM.serialize(); 

         response.send(data);
       }
     }); 
    }


    
});












