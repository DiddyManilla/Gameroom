/*global $*/
/*global io*/

var socket = io.connect("/mancala");

$(document).ready(function() {
    
    function mOver(obj){
		obj.css('backgroundColor', '#0000ff');
	}
	function mOut(obj){
		obj.css('backgroundColor', '#000099');
	}
       
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
    });
    
    $(".pit").on("click", function() {
        socket.emit("turn", parseInt($(this).attr("id").substr(1)));
        console.log("Emitted event with data " + parseInt($(this).attr("id").substr(1)));
    });
    
    
    socket.on("chatMessage", function(data){
       $("#chatlog-messages").append("<li><b>"+data.name+": </b>"+data.message+"</li>");
    });

    
    socket.on("kick", function() {
        socket.disconnect();
        console.log("disconnected");
    });
     $('#button-send').on('mouseover', function() {
        mOver($(this));
    }).on('mouseleave', function() {
        mOut($(this));
    });
    var updateID;
    socket.on("newData", function(data) {
        
        console.log(data);
        clearTimeout(updateID || 0);
        
        function setPits(index, firstPit) {
            
            //firstPit is the 12-parsed pit to start with. It can never be an endzone.
            //index is 14-parsed, and is the index that the function is recursing on right now. Compare to firstPit to terminate.
            
            
            index %= 14;
            
            if (index >= 0 && index < 6) {
                $("#p" + index).text(data.pits[index]);
            } else if (index == 6) {
                $("#p2score").text(data.rightScorePit);
            } else if (index >= 7 && index < 13) {
                $("#p" + (index - 1)).text(data.pits[index - 1]);
            } else if (index == 13) {
                $("#p1score").text(data.leftScorePit);
            }
            
            
            if (true) {
                updateID = setTimeout(function() {
                    setPits(index + 1, firstPit);
                }, 250);
            }
        }
        
        //updates local pits with pits from server
        data.firstPit = 0 <= data.firstPit && data.firstPit < 6 ? data.firstPit : data.firstPit + 1;
        
        setPits(data.firstPit, data.firstPit);
        
    });
});