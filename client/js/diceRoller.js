/*global $*/
/*global socket*/
$(document).ready(function() {
    
    var socket = io.connect("/diceroller");
            
    //TODO: get players from server and pass it to the game
    
    var dieImageDict = {
        1:"/img/dice1.jpg",
        2:"/img/dice2.jpg",
        3:"/img/dice3.jpg",
        4:"/img/dice4.jpg",
        5:"/img/dice5.jpg",
        6:"/img/dice6.jpg"
    };
    //When we are told that a player has sat down, make it so.
    socket.on("newRoll", function(data){
        console.log("Received new data from the server");
        document.getElementById("dieFace").src = dieImageDict[data.roll];
        $('#dieFace').css('outline', '3px solid black');
    });
    
    //When a chat message is sent, add its stuff to the appropriate uls
    socket.on("chatMessage", function(data) {
        $("#chatlog-messages").append("<li><b>"+data.name+": </b>"+data.message+"</li>");
    });
    
    socket.on("newScore", function(data){
       document.getElementById("score").innerHTML = "Score: "+data.toString();
    });
    function mOver(obj){
        obj.css('backgroundColor','#0000ff');
    }
    function mOut(obj){
        obj.css('backgroundColor','#000099');
    }
    function sitOption(obj){
        obj.css("width", '100%');
        $("#stand").css("display","none");
        $("#sit").html("Unavailable");
        /*$('#dieFace').css('transform', 'translate(-90%, 96px)');*/
    }
    
    $('#sit').on('click', function() {
        
        sitOption($(this));
        
        $('#sit').off('click');
        $('#stand').off('click');
        
        socket.emit('playerAction', false);
        
    }).on('mouseover', function() {
        mOver($(this));
    }).on('mouseleave', function() {
        mOut($(this));
    });
    
    $('#stand').on('click', function() {
        socket.emit('playerAction', true);
    }).on('mouseover', function() {
        mOver($(this));
    }).on('mouseleave', function() {
        mOut($(this));
    });
    
    function sendMessage(){
        socket.emit("chatMessage", {
            "name":document.getElementById("name").value,
            "message":document.getElementById("message").value
        });
        console.log("sending chat message");
    }
    
    $('#message').on('keydown', function(event) {
        if (event.keyCode == 13) {
            sendMessage();
        }
    });
     $('#button-send').on('mouseover', function() {
        mOver($(this));
    }).on('mouseleave', function() {
        mOut($(this));
    });
    $('#button-send').on('click', sendMessage);
});