/*global $*/
/*global io*/


$(document).ready(function() {
    
    var socket = io.connect("/senet");
    
    function mOver(obj){
		obj.css('backgroundColor', '#ff0000');
	}
	function mOut(obj){
		obj.css('backgroundColor', '#990000');
	}
    //--------------------------Gameplay-----------------------------------
    var cells=["su","am","su","am","su","am","su","am","su","am", "emp","emp","emp","emp","emp","emp",
    "emp","emp","emp","emp","emp","emp","emp","emp","emp","emp","emp","emp","emp","emp"];
    
    function diceroll() {
        socket.emit('getDieRoll');
    }
    
    function refresh() {
        
        $('.pit').empty();
        
        for(var i = 0; i < 30; i++){
            if(cells[i] == "am"){
                insert_image1($("#p"+i));
            } else if (cells[i] == "su"){
                insert_image2($("#p"+i));
            }
        }
        
    }
    
    function insert_image1(obj){
        $(obj).append('<img width="100%" height="100px" src="img/senetpiece1.png" />');
    }
    function insert_image2(obj){
        $(obj).append('<img width="100%" height="100px" src="img/senetpiece2.png" />');
    }
    
    refresh();
    socket.on('pushDieRoll', function(sticks) {
        
        
        
        $('#stick1').css('background-color', sticks[0] == 1 ? '#000' : '#fff');
        $('#stick2').css('background-color', sticks[1] == 1 ? '#000' : '#fff');
        $('#stick3').css('background-color', sticks[2] == 1 ? '#000' : '#fff');
        $('#stick4').css('background-color', sticks[3] == 1 ? '#000' : '#fff');
        
        
        
        var sum = 0;
        sticks.forEach(function(stick){
            sum += stick;
        });
        var roll = sum === 0 ? 6 : sum;
        $('#roll').text("Roll: " + roll);
    });
    
    
    $('#roll').on('click', diceroll);
    
    
    $('.pit').on('mouseover', function() {
        mOver($(this));
    }).on('mouseleave', function() {
        mOut($(this)); 
    }).on('click', function() {
         socket.emit('turn', parseInt($(this).attr('id').substr(1), 10));
         console.log("Emitted event with data " + parseInt($(this).attr("id").substr(1), 10));
    });
    
    socket.on("kick", function(){
        socket.disconnect();
        console.log("disconnected");
    });
    
    socket.on("newData", function(data){
        console.log('Data came.');
        console.log(data);
        //parses pits data
        for (var i = 0; i < data.length; i++) {
            cells[i] = data[i];
        }
        refresh();
    });
    
    
    //--------------------------Messaging-----------------------------------
    function sendMessage(){
        console.log(socket);
        socket.emit("chatMessage", {
            "name": $("#name").val(),
            "message": $("#message").val()
        });
        console.log("sending chat message");
        console.log(socket);
    }
    
    $('#message').on('keydown', function(event) {
        if (event.keyCode == 13) {
            sendMessage();
        }
    });
    
    
    $('#button-send').on('click', sendMessage);
    
    
    socket.on("chatMessage", function(data){
       $("#chatlog-messages").append("<li><b>"+data.name+": </b>"+data.message+"</li>");
       var chatdiv = $("#messages");
       chatdiv.scrollTop(chatdiv.prop("scrollHeight"));
    });
    
});