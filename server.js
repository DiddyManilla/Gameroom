"use strict";
var http = require('http');
var path = require('path');

var socketio = require('socket.io');
var express = require('express');



var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

app.use(express.static(__dirname + '/client'));




//------------------ALL THE DICEROLLER STUFF---------------------------------//






var diceRollerGame = {
    lastRoll: 0,
    roundNumber: 0,
    gameEnded: false, //Whether or not the game is over
    endGame: function(){
        diceRollerGame.gameEnded = true;
        
        //sets up for the next game
        diceRollerGame.lastRoll = 0;
        diceRollerGame.roundNumber = 0;
        
        io.of("/diceroller").clients().forEach(function(socket) {
            socket.standing = false;
        });
        var winningSocket = io.of("/diceroller").clients()[0]; //The first player always wins if it's an n way tie
        io.of("/diceroller").clients().forEach(function(socket){
           if(socket.score > winningSocket.score){
               winningSocket = socket;
           } 
        });
        //By now winningSocket is the socket with the highest score
        io.of("/diceroller").emit("chatMessage", {"name":"Server", "message":"The winning score was "+winningSocket.score.toString()});
        winningSocket.emit("chatMessage", {"name":"Server", "message":"Congratulations! You won!"});
        winningSocket.broadcast.emit("chatMessage", {"name":"Server", "message":"You lost. You must suck at this game."});
    }
};

io.of('/diceroller').on('connection', function(socket) {
      
      //sockets.push(socket);
      //Sets up all the socket variables
      socket.pushedButton = false; //Whether or not the player has chosen an action yet
      socket.standing = true; //Whether or not the player is standing
      socket.score = 0; //The socket's score
      
      socket.pushedButton = false;
      
      socket.on('chatMessage', function(data) {
        io.of('/diceroller').emit("chatMessage", data);
      });
      
      socket.on("disconnect", function(socket){
          console.log("A player has disconnected");
          if(io.of("/diceroller").clients().length == 1){
              diceRollerGame.gameEnded = false;
              console.log("Un-ended the game");
          }
      });
      
      
      
      socket.on("playerAction", function(standing){
          
          //if the game is over, do nothing
          if(diceRollerGame.gameEnded){
            console.log("The game is ended, so nobody can do anything.");
            return;
          }
          
          socket.pushedButton = true;
          socket.standing = standing;
          console.log("A player has chosen to " + (standing ? "stand":"sit"));
          
          //Check if everybody has pressed a button yet
          var readyToRoll = function() {
                var returnVal = true;
                
                io.of("/diceroller").clients().forEach(function(socket){
                  if(!socket.pushedButton){
                    returnVal = false;
                  }
                  console.log(socket.pushedButton);
                });
                
                return returnVal;
          };
          
          if (readyToRoll()) {
              //Does everyting necessary to 'make another round'
            
              //rolls die again
              var die = Math.ceil(Math.random() * 6);
              die = die == 0 ? 1 : die;
              
              //Emits a newroll event
              io.of('/diceroller').emit("newRoll", {"roll":die});
              console.log("Rolled the die again");
              io.of("/diceroller").emit("chatMessage", {"name":"Server", "message":"The die rolled again!"});
              
              //Goes through and updates the socket's scores.
              io.of("/diceroller").clients().forEach(function(socket){
                if (socket.standing) {
                  socket.score += die; 
                }
              });
              
              //If the same number was rolled, everybody sits down.
              if(diceRollerGame.lastRoll === die){
                io.of("/diceroller").emit("chatMessage", {"name":"Server", "message":"The same number was rolled! Game over"});
                //Sets the standing players' scores to 0
                io.of("/diceroller").clients().forEach(function(socket){
                    if (socket.standing) {
                        socket.score = 0;
                    }
                });
                diceRollerGame.endGame();
                return;
              }
              
              //Emits all the newScore events
              io.of("/diceroller").clients().forEach(function(socket) {
                socket.emit("newScore", socket.score);
              });
              
              //sets pushedButton events again
              var everybodySitting = true; //used to determine if everybody is sitting down
              io.of("/diceroller").clients().forEach(function(socket){
                  //lets a person stand or sit
                  if(socket.standing){
                    socket.pushedButton = false;
                    everybodySitting = false; //Somebody was found who was standing
                  } else
                    socket.pushedButton = true;
              });
              
              //if everybody is sitting, tell them and end the game.
              if(everybodySitting){
                io.of("/diceroller").emit("chatMessage", {"name":"Server", "message":"Everybody is sitting down. Game over"});
                diceRollerGame.endGame();
                return;
              }
              //sets up for next round
              diceRollerGame.lastRoll = die;
          }
      });
      
      //Sends the log-on message to the chat
      var numPlayers = io.of("/diceroller").clients().length;
      var numSuffix = 'th';
      if (numPlayers % 100 >= 10 && numPlayers % 100 < 14) {
        
      } else if (numPlayers % 10 == 1) {
        numSuffix = 'st';
      } else if (numPlayers % 10 == 2) {
        numSuffix = 'nd';
      } else if (numPlayers % 10 == 3) {
        numSuffix = 'rd';
      }
      io.of("/diceroller").emit("chatMessage", {"name":"Server", "message":"The " + numPlayers + numSuffix + " player joined the game"});
    
      console.log("A player has connected to diceroller");
});




//------------------ALL THE MANCALA STUFF---------------------------------//






var mancalaGame = {
    
    gameRunning:false,
    gameJoinable:true,
    turn:0, //The player whose turn it is
    pits:[ //The non-scoring pits
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
    ],
    leftScorePit:0,
    rightScorePit:0,
    
    endGame:function(){
      for(var i = 0; i < mancalaGame.pits.length; i++){
        mancalaGame.pits[i] = 4;
      }
      mancalaGame.leftScorePit = 0;
      mancalaGame.rightScorePit = 0;
      mancalaGame.turn = 0;
      mancalaGame.gameJoinable = true;
    }
};

io.of("/mancala").on("connection", function(socket){
  
  console.log("A player has connected to the mancala server");
  var numPlayers = io.of("/mancala").clients().length;
    var numSuffix = 'th';
    if (numPlayers % 100 >= 10 && numPlayers % 100 < 14) {
      
    } else if (numPlayers % 10 == 1) {
      numSuffix = 'st';
    } else if (numPlayers % 10 == 2) {
      numSuffix = 'nd';
    } else if (numPlayers % 10 == 3) {
      numSuffix = 'rd';
    }
  io.of("/mancala").emit("chatMessage", {"name":"Server", "message":"A "+numPlayers + numSuffix +" player connected"});
  
  if(io.of("/mancala").clients().length === 1){
      io.of("/mancala").emit("chatMessage", {"name":"Server", "message":"Alright, waiting for an opponent to join"});
  } else if(io.of("/mancala").clients().length === 2){
      io.of("/mancala").emit("chatMessage", {"name":"Server", "message":"Now the game can really begin."});
      mancalaGame.gameRunning = true;
      mancalaGame.gameJoinable = false;
  }
  
  socket.on("disconnect", function(socket){
      if(io.of("/mancala").clients().length === 2){
          io.of("/mancala").emit("chatMessage", {"name":"Server", "message":"Your opponent ragequit. You win, I guess."});
          mancalaGame.gameRunning = false;
      } else if (io.of("/mancala").clients().length === 1){
          mancalaGame.endGame();
      }
  });
      
  //handles it when a player emits a 'turn' event
  socket.on("turn", function(data){
    
    //if game isn't running, do nothing
    if(!mancalaGame.gameRunning)
      return;
    
    if(io.of("/mancala").clients().indexOf(socket) === mancalaGame.turn) { //If this is the same socket as the player who connected
      
      //validates move. Returns if it's invalid
      //We know that the appropriate player just played, so turn is the same as the player who just went.
      if(
        ((mancalaGame.turn === 0 && 0 <= data && data < 6) || //If Player 0 clicked on cells 0 through 6
        (mancalaGame.turn === 1 && 6 <= data && data < 12)) && //If Player 1 clicked on cells 6 through 12
        (mancalaGame.pits[data] !== 0) //And the clicked cell isn't 0
      ) {
        //Then the move is valid
      } else {
        socket.emit("chatMessage", {"name":"Server", "message":"That's not a valid move. Try again, please."});
        return; //Don't perform any of the rest of the function.
      }
      
      io.of("/mancala").emit("chatMessage", {"name":"Server", "message":"Player "+(io.of("/mancala").clients().indexOf(socket)+1)+" made a valid move"});
      mancalaGame.turn = !mancalaGame.turn ? 1 : 0; //Changes the turn
       
      //Processes actual gameplay
      var movingPebbles = mancalaGame.pits[data];
      mancalaGame.pits[data] = 0;
      var pitNum;
      for(var i = data + 1; i < data + movingPebbles + 1; i++) {//Each pit ahead of the selected pit within the movingPebbles range recieves another pebble.
        pitNum = i % 13;
        
        //if Player 0 just played...
        if(mancalaGame.turn === 1){//IMPORTANT: The turn has already been switched. So this is inverted.
          if(0 <= pitNum && pitNum < 6)
            mancalaGame.pits[pitNum]++; //If the pit number is between 0 and 6, it's on the top row, and no offset is required.
          else if(pitNum === 6)
            mancalaGame.rightScorePit++; //Pit 6 is considered to be the right scoring pit.
          else
            mancalaGame.pits[pitNum-1]++; //The pit numbers are offsetted from the pit numbers of the pits array because of the above conditional.
        }
        
        //If the other player just played (Player 1)
        else {
          if(pitNum !== 12)
            mancalaGame.pits[pitNum]++; //Just go straight across. The only difference is that pit 13 is considered to be the left scoring pit.
          else
            mancalaGame.leftScorePit++;
        }
      }
      
      //If last pebble went into empty pit, move it and opposite pebbles to controller's goal.
      //If Player 0 just went and the last pebble went in pits 0 through 6 and that pit has just one pebble in it...
      var pointsStolen;
      if(mancalaGame.turn === 1 && 0 <= pitNum && pitNum < 6 && mancalaGame.pits[pitNum] === 1){
        mancalaGame.pits[pitNum] = 0; //Remove that pebble
        pointsStolen = mancalaGame.pits[11-pitNum] + 1; //Plus 1 for the pebble from the above line
        mancalaGame.pits[11-pitNum] = 0;
        mancalaGame.rightScorePit += pointsStolen; //Add all the stolen points to the right endzone
      }
      //If Player 1 just went and the last pebble went in pits 6 through 12 and that pit has just one pebble in it...
      if(mancalaGame.turn === 0 && 6 <= pitNum && pitNum < 12 && mancalaGame.pits[pitNum] === 1){
        mancalaGame.pits[pitNum] = 0; //Remove that pebble
        pointsStolen = mancalaGame.pits[11-pitNum] + 1; //Plus 1 for the pebble from the above line
        mancalaGame.pits[11-pitNum] = 0;
        mancalaGame.leftScorePit += pointsStolen; //Add all the stolen points to the right endzone
      }
      
      //Check victory conditions
      var topRowContainsSomething = false;
      mancalaGame.pits.slice(0,6).forEach(function(pit){
        if(pit !== 0){
          topRowContainsSomething = true;
        }
      });
      
      var bottomRowContainsSomething = false;
      mancalaGame.pits.slice(7,12).forEach(function(pit){
        if(pit !== 0){
          bottomRowContainsSomething = true;
        }
      });
      if(!topRowContainsSomething || !bottomRowContainsSomething) {
        //End game
        
        //Give remaining pebbles to appropriate player
        for(var i = 0; i < mancalaGame.pits.length; i++) {
          if(0 <= i && i < 6){
            mancalaGame.rightScorePit += mancalaGame.pits[i];
          } else {
            mancalaGame.leftScorePit += mancalaGame.pits[i];
          }
          mancalaGame.pits[i] = 0;
        }
        //By now, everything is set up to transmit the final standings to the players.
        mancalaGame.gameRunning = false;
        io.of("/mancala").emit("newData", {"pits":mancalaGame.pits, "leftScorePit":mancalaGame.leftScorePit, "rightScorePit":mancalaGame.rightScorePit, "firstPit":data});
        io.of("/mancala").emit("chatMessage", {"name":"Server", "message":(mancalaGame.leftScorePit > mancalaGame.rightScorePit ? "Player 2" : "Player 1")+" has won!"});
        mancalaGame.endGame();
        mancalaGame.gameJoinable = false; //Still don't let anybody join the game.
        return;
      }
      
      
      //If the last pebble went into the endzone, go again.
      //If Player 0 just played (and it would be Player 1's turn)
      if(mancalaGame.turn === 1 && pitNum === 6){
        mancalaGame.turn = 0; //If the last PitNum was Player 1's goal, he gets to go again
        io.of("/mancala").emit("chatMessage", {"name":"Server", "message":"Player 1 gets to go again"});
      }
      //If Player 1 just played (and it would be Player 0's turn)
      if(mancalaGame.turn === 0 && pitNum === 12){
        mancalaGame.turn = 1; //If the last PitNum was Player 2's goal, he gets to go again
        io.of("/mancala").emit("chatMessage", {"name":"Server", "message":"Player 2 gets to go again"});
      }
      
      
      //emits to each player the new data
      io.of("/mancala").emit("newData", {"pits":mancalaGame.pits, "leftScorePit":mancalaGame.leftScorePit, "rightScorePit":mancalaGame.rightScorePit, "firstPit":data});
      
    } else {
      socket.emit("chatMessage", {"name":"Server", "message":"Not your turn, mate."});
    }
  });
  
  //adds messages to the chat
  socket.on("chatMessage", function(data){
      io.of("/mancala").emit("chatMessage", data);
  });
});




//------------------ALL THE SENET STUFF---------------------------------//




var senetGame = {
  gameJoinable: true,
  gameRunning: false,
  cells: [],
  sticks: [0, 0, 0, 0],
  turn: 0,
  diceRolledYet:false,
  
  ussrNukes: 0,
  usaNukes: 0,
  
  getLegal:function(socket){
    if(io.of("/senet").clients().indexOf(socket) === senetGame.turn){
      return true;
    }
    return false;
  },
  
  isLegal: function(socket, data) {
    
    if (!senetGame.gameRunning) {
      return false;
    }
    
    if(!senetGame.getLegal(socket)) { //Return false if it's not their turn
      return false;
    }
    
    if(!senetGame.diceRolledYet) {
      return false;
    }
    
    //data here represents the index of the cell they clicked.
    //checks if the move is valid
    //checks if that is their piece
    
    
    
    if(senetGame.turn === 0 && senetGame.cells[data] !== "am" || senetGame.turn === 1 && senetGame.cells[data] !== "su"){ //If the player isn't clicking their own piece
      return false;
    }
    
    if(senetGame.turn === 0 && senetGame.cells[data+senetGame.getStickSum()] === "am" || senetGame.turn === 1 && senetGame.cells[data+senetGame.getStickSum()] === "su"){
      return false; //If the player is attempting to move onto their own piece
    }
    
    if(senetGame.turn === 0 && senetGame.cells[data+senetGame.getStickSum()] === "su" && 
      (senetGame.cells[data+senetGame.getStickSum()+1] === "su" || senetGame.cells[data+senetGame.getStickSum()-1] === "su")){
        return false; //If an american is playing and they're going to land on a soviet and there is a soviet on either side of the target
    }
    
    if(senetGame.turn === 1 && senetGame.cells[data+senetGame.getStickSum()] === "am" && 
      (senetGame.cells[data+senetGame.getStickSum()+1] === "am" || senetGame.cells[data+senetGame.getStickSum()-1] === "am")){
        return false; //Same as above, but vise versa.
    }
    return true;
  },
  
  reset:function(){
    for (var i = 0; i < 10; i++) {
      senetGame.cells[i] = i % 2 == 0 ? "su" : "am";
    }
    
    for(var i = 10; i < 30; i++){
      senetGame.cells[i] = "emp";
    }
    senetGame.gameJoinable = true;
    senetGame.gameRunning = false;
    senetGame.turn = 0;
    senetGame.diceRolledYet = false;
  },
  
  getStickSum:function(){
    var sum = 0;
    senetGame.sticks.forEach(function(stick){
      sum += stick;
    });
    var sum = sum === 0 ? 6 : sum;
    return sum;
  }
};

senetGame.reset();

io.of('/senet').on('connection', function(socket){
  
  if(io.of("/senet").clients().length === 1){
    io.of("/senet").emit("chatMessage", {"name":"Server", "message":"The Player 1 connected. Just waiting for an opponent now."});
  } else if (io.of("/senet").clients().length === 2){
    io.of("/senet").emit("chatMessage", {"name":"Server", "message":"Player 2 connected. Ready for combat."});
    senetGame.gameJoinable = false;
    senetGame.gameRunning = true;
  }
  
  socket.on("disconnect", function(socket){
    if(io.of("/senet").clients().length === 2){
      io.of("/senet").emit("chatMessage", {"name":"Server", "message":"Your opponent has surrendered! The COWARDS!"});
      senetGame.gameRunning = false;
    } else if(io.of("/senet").clients().length === 1){
      senetGame.reset();
    }
  });
  
  socket.on("getDieRoll", function() {
    if (!senetGame.gameRunning) {
      return;
    }
    if(!senetGame.getLegal(socket)) { //returns if it's not their turn.
      socket.emit("chatMessage", {name:"Server", message:"It's not your turn."});
      return;
    }
    if(senetGame.diceRolledYet) { //If the die was already rolled, don't roll it again
      socket.emit("chatMessage", {name:"Server", message:"You already rolled the die."});
      return;
    }
    
    
    for(var i = 0; i < 4; i++){
      senetGame.sticks[i] = Math.floor(Math.random()*2);
    }
    io.of("/senet").emit("pushDieRoll", senetGame.sticks);
    senetGame.diceRolledYet = true;
    //Check whether the player whose turn it is can move

    var canMove = false;
    for (var i = 0, length = senetGame.cells.length, turn = senetGame.turn,
                cells = senetGame.cells; i < length; i++) {
                  
      if (turn == 0 && cells[i] == "am" && senetGame.isLegal(socket, i)) {
        canMove = true;
      } else if (turn == 1 && cells[i] == "su" && senetGame.isLegal(socket, i)) {
        canMove = true;
      }
    }
    //If they can't,
    if (!canMove) {
      //Reverse turn, tell players
      io.of("/senet").emit("chatMessage", {
        name:"Server", 
        message: `Player ${senetGame.turn + 1} cannot move. It is now Player ${(senetGame.turn === 0 ? 1 : 0) + 1}'s turn.`});
      senetGame.turn = senetGame.turn === 0 ? 1 : 0;
      senetGame.diceRolledYet = false;
    } 
  });
  
  socket.on("turn", function(data){
    
    
    if (!senetGame.gameRunning) {
      return;
    }
    if (!senetGame.getLegal(socket)) {
      socket.emit("chatMessage", {name:"Server", message:"It's not your turn."});
      return;
    }
    if(!senetGame.diceRolledYet){
      socket.emit("chatMessage", {name:"Server", message:"You need to roll the dice first."});
      return;
    }
    
    var validMove = senetGame.isLegal(socket, data);
    if (validMove) {
      //by now, the move is fully validated
      //process the move
      if(data+senetGame.getStickSum() > 29){
        //If the moved piece gets off the board
        senetGame.cells[data] = "emp";
        
        if(senetGame.turn === 0) {
          senetGame.usaNukes++;
        } else {
          senetGame.ussrNukes++;
        }
        if(senetGame.usaNukes >= 5 || senetGame.ussrNukes >= 5){
          io.of("/senet").emit("chatMessage", {name:"Server", message:(senetGame.turn === 0 ? "The United States (Player 1)" : "The Soviet Union (Player 2)")+" has won!"});
          io.of("/senet").emit("newData", senetGame.cells);
          senetGame.gameRunning = false;
          return;
        }
        
      } else {
        var tmp = senetGame.cells[data+senetGame.getStickSum()]; //tmp is the value that's about to be replaced.
        senetGame.cells[data+senetGame.getStickSum()] = senetGame.cells[data];
        senetGame.cells[data] = tmp;
      }
      //by now, the original piece and the destination have been switched.
      io.of("/senet").emit("newData", senetGame.cells);
      
      //Down here at the end, switch the turns
      senetGame.turn = senetGame.turn === 0 ? 1 : 0;
      senetGame.diceRolledYet = false;
    } else {
      socket.emit("chatMessage", {name:"Server", message: "That move is against the rules of warfare."});
    }
  });
    
  socket.on('chatMessage', function(data) {
    io.of('/senet').emit("chatMessage", data);
  });
  
});



//-----------------Routing-------------------
app.get("/", function(req, res) {
  
    res.sendfile(__dirname+"/client/index.html");
    
})
.get('/diceroller', function(req, res) {
  
    res.sendfile(path.join(__dirname + '/client/diceroller.html'));
    
})
.get("/mancala", function(req, res){
  
    if (!mancalaGame.gameJoinable) {
      res.sendfile(path.join(__dirname + '/404.html'));
    } else {
      //Stop browser from caching page
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
      res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
      res.setHeader("Expires", "0"); // Proxies.
      
      res.sendfile(path.join(__dirname + "/client/mancala.html"));
    }
})
.get("/senet", function(req, res){
  if (!senetGame.gameJoinable) {
    res.sendfile(path.join(__dirname + '/404.html'));
  } else {
    //Stop browser from caching page
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
    res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
    res.setHeader("Expires", "0"); // Proxies.
    
    res.sendfile(path.join(__dirname + "/client/senet.html"));
  }
});

io.set('log level', 1);
server.listen(process.env.PORT || 8080, process.env.IP || 'localhost', function(){
    console.log("server began listening");
});