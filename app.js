'use strict';

//Filen app.js är den enda ni skall och tillåts skriva kod i.
//majoriteten av koden är tagen från föreläsningar och workshops. 

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

const io = require('socket.io')(server);

//alla middleware för public folder som inte finns och byter ut den mot static, cookies och så serverkan läsa datan med urlencoded
app.use('/public', express.static(__dirname + '/static'));
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());

//get metod på rooten där den vi kontrollerar om det finns cookies på servern och om det finns så skickar vi index filen annars så skickar vi loggain filen
app.get('/', function(request, response){
    let nickname = request.cookies.nickName;
    let color = request.cookies.color;

    if(nickname !== undefined && color !== undefined){
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
    
    try{

      let color1 = request.body.color_1;
      let nick1 = request.body.nick_1;

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

        if(nick1 === globalObject.playerOneNick){
          throw{
            errorMsg : 'Nickname redan valt'
          }
        }
        if(color1 === globalObject.playerOneColor){
          throw{
            errorMsg : 'Färg redan valt'
          }
        }
       
      response.cookie('nickName', nick1, {maxAge : 2 * 60 * 60 * 1000});
      response.cookie('color', color1, {maxAge : 2* 60 * 60 * 1000});

      response.redirect("/"); 

    //när något fel uppstår i try:en så fångas det upp här i "eo"
    //läser in loggain filen till servern och bygger upp en virtuell DOM
    //hämtar element och ändrar dess innehåll, serializerar det och skickar till servern det med response. 
    }catch(eo){
     fs.readFile(__dirname + '/static/html/loggain.html',  function(err, data){
       if(err){
         console.log('kunde inte läsa in fil');
       }else{
         let serverDOM = new jsDOM.JSDOM(data);
          
         serverDOM.window.document.querySelector('#errorMsg').textContent = eo.errorMsg;
         serverDOM.window.document.querySelector('#nick_1').setAttribute('value', request.body.nick_1);
         serverDOM.window.document.querySelector('#color_1').setAttribute('value', request.body.color_1);

         data = serverDOM.serialize(); 

         response.send(data);
       }
     }); 
    }

});

//socket anslutningen med händelsen "connection"
//hämtar cookie sträng med handshak metod som är hämtad från föreläsning/workshop med Pierre
//använder parseCookie metoden som finns i game-modul.js
io.on('connection', function(socket){

  let cookieString = socket.handshake.headers.cookie; 
  let list = globalObject.parseCookies(cookieString);

  //kontroll om kakorna finns så görs det ytterligare en kontroll om vilken spelare som är ansluten via socketID
  //sätter också spelare 1 och 2's attribut, name och color.
  if(list.nickName !== undefined && list.color !== undefined){

    if(globalObject.playerOneSocketId === null){

      globalObject.playerOneSocketId = socket.id;
      globalObject.playerOneNick = list.nickName;
      globalObject.playerOneColor = list.color;

    }else if(globalObject.playerTwoSocketId === null && globalObject.playerOneSocketId !== null){
      globalObject.playerTwoSocketId = socket.id;
      globalObject.playerTwoNick = list.nickName;
      globalObject.playerTwoColor = list.color;
      globalObject.resetGameArea();

    }else{
      console.log('redan 2 spelare anslutna');
      socket.disconnect(true);

    }

  }else{
    console.log('kakor saknas!');
    socket.disconnect(true);
    
  }

  //när båda spelarnas nickname är satta så börjar spelet och timern/timeouten anropas. 
  //skapar 2 objekt för spelare 1 och 2. skickar värdena med händelse newGame 
  if(globalObject.playerOneNick !== null && globalObject.playerTwoNick !== null){

    timeout();

    let dataPlayerOne = {
      opponentNick : globalObject.playerTwoNick,
      opponentColor : globalObject.playerTwoColor,
      myColor : globalObject.playerOneColor
    }
    io.to(globalObject.playerOneSocketId).emit('newGame', dataPlayerOne);
    globalObject.currentPlayer = 1;
    io.to(globalObject.playerOneSocketId).emit('yourMove');

    let dataPlayerTwo = {
      opponentNick : globalObject.playerOneNick,
      opponentColor : globalObject.playerOneColor,
      myColor : globalObject.playerTwoColor
    }
    io.to(globalObject.playerTwoSocketId).emit('newGame', dataPlayerTwo);
  }
  //händelse newMove som uppdaterar spelarens drag. Uppdaterar spelplanens array med currentPlayer. 1 eller 2
  //sedan kontrolleras vinnaren med metoden checkForWinner som hämtas från game-modul.js
  //funktionen returnerar 1 om spelare 1 vinner och 2 om spelare 2 vinner, då vi uppdaterar arreyen med currentplayer
  //returnerar den 3 så är det oavgjort och 0 så fortsätter spelet
  socket.on('newMove', function(data){
    clearTimeout(globalObject.timerId);
    globalObject.timerId = 0;

    if(socket.id === globalObject.playerOneSocketId){
      io.to(globalObject.playerTwoSocketId).emit('yourMove', data);
      globalObject.gameArea[data.cellId] = globalObject.currentPlayer;
      globalObject.currentPlayer = 2;

    }else{

      io.to(globalObject.playerOneSocketId).emit('yourMove', data);
      globalObject.gameArea[data.cellId] = globalObject.currentPlayer;
      globalObject.currentPlayer = 1;

    }

    globalObject.timerId = setTimeout(timeout, 5000);

    let winner = globalObject.checkForWinner();
    if(winner === 1){
      io.emit('gameover', 'vinnaren är '+ globalObject.playerOneNick);
      globalObject.timerId = 0;
    }
    if(winner === 2){
      io.emit('gameover', 'vinnaren är '+ globalObject.playerTwoNick);
      globalObject.timerId = 0;
    }
    if(winner === 3){
      io.emit('gameover', 'OAVGJORT');
      globalObject.timerId = 0;
    }


  });
  
});

//funktion som startar timer på 5 sekunder och byter spelare om det har gått 5 sekunder. 
function timeout(){

  clearTimeout(globalObject.timerId);
  globalObject.timerId = 0;

  if(globalObject.currentPlayer === 1){
    io.to(globalObject.playerOneSocketId).emit('timeout');
    io.to(globalObject.playerTwoSocketId).emit('yourMove');
    globalObject.currentPlayer = 2;
  }else{
    io.to(globalObject.playerTwoSocketId).emit('timeout');
    io.to(globalObject.playerOneSocketId).emit('yourMove');
    globalObject.currentPlayer = 1;
  }

  globalObject.timerId = setTimeout(timeout,5000);
}
