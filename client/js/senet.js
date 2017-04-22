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
    var cells=["am","su","am","su","am","su","am","su","am","su","emp","emp","emp","emp","emp","emp",
    "emp","emp","emp","emp","emp","emp","emp","emp","emp","emp","emp","emp","emp","emp"];
    var p1turn=true;
    var p2turn=false;
    var canroll = true;
    var canaction= false;
    var finalroll;
    
    function diceroll() {
        socket.emit('getDieRoll');
    }
    
    function action(obj){
        
        //socket.emit('move', )
        /*var id = obj.id;
        var IDnum = parseInt(id.substring(1,id.length));
        if(canaction && cells[IDnum] == "am" && cells[IDnum+finalroll] != "am" && p1turn) {
            cells[IDnum] = cells[IDnum+finalroll];
            cells[IDnum+finalroll] = "am";
            canroll=true;
            canaction=false;
            p1turn=false;
            p2turn=true;
            refresh();
        }
    
        else if(canaction && cells[IDnum] == "su" && cells[IDnum+finalroll] != "su" && p1turn) {
            cells[IDnum] = cells[IDnum+finalroll];
            cells[IDnum+finalroll] = "su";
            canroll=true;
            canaction=false;
            p1turn=true;
            p2turn=false;
            refresh();
        }*/
    }
    function refresh() {
        for(var i = 0; i < 30;i++){
            $("#p"+i).empty();
        }
        for(var i = 0; i < 30;i++){
            if(cells[i] == "am"){
                insert_image1($("#p"+i));
            }
            if(cells[i] == "su"){
                insert_image2($("#p"+i));
            }
        }
    }
    
    function insert_image1(obj){
        $(obj).append('<img width="100%" height="100px" src="img/senetpiece1.png" />')
        /*var src = document.getElementById(obj);
        var img=document.createElement("img");
        img.src="img/senetpiece1.png";
        src.appendChild(img);*/
    }
    function insert_image2(obj){
        $(obj).append('<img width="100%" height="100px" src="img/senetpiece2.png" />')
        /*var src = document.getElementById(obj);
        var img=document.createElement("img");
        img.src="img/senetpiece2.png";
        src.appendChild(img);*/
    }
    
    socket.on('pushDieRoll', function(sticks) {
        
        var sum = 0;
        sticks.forEach(function(stick){
            sum += stick;
        });
        var roll = sum === 0 ? 6 : sum;
        $('#roll').text("Roll: " + roll);
    });
    
    
    $('#roll').on('click', diceroll);
    
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
    
    
    
    
    
    $('.pit').on('mouseover', function() {
        mOver($(this));
    }).on('mouseleave', function() {
        mOut($(this)); 
    }).on('click', function() {
         socket.emit('turn', parseInt($(this).attr('id').substr(1), 10));
         console.log("Emitted event with data " + parseInt($(this).attr("id").substr(1), 10));
    });
    
    
    socket.on("chatMessage", function(data){
       $("#chatlog-messages").append("<li><b>"+data.name+": </b>"+data.message+"</li>");
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
    
    
});