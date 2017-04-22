/*global $*/
/*global socket*/
$(document).ready(function() {
    
    function mOver(obj){
        obj.css('backgroundColor', '#0000ff');
        obj.css('color', '#ffffff');
    }
    function mOut(obj){
        obj.css('backgroundColor', '#000099');
        obj.css('color', '#fff');
    }
    function mOverRed(obj){
        obj.css('backgroundColor', '#ff0000');
        obj.css('color', '#ffffff');
    }
    function mOutRed(obj){
        obj.css('backgroundColor', '#dd0000');
        obj.css('color', '#fff');
    }
    
    function tabClick(obj,evt){
        var id = obj.attr('id');
        var dispID = id.substring(0,id.length-3);
        console.log(dispID);
        $("#Diceroller").css('display', "none");
        $("#Mancala").css('display', "none");
        $("#Senet").css('display', "none");
        $("#Welcome").css('display', "none");
        $("#" + dispID).css('display', "block");
    }
    
    $('.tab').on('click', function() {
        tabClick($(this), event);
    }).on('mouseover', function() {
        mOverRed($(this));
    }).on('mouseleave', function() {
        mOutRed($(this));
    });
    
    $('form > button').on('mouseover', function(event) {
        mOver($(this));
    }).on('mouseleave', function(event) {
        mOut($(this)); 
    });
    
    /*$('button').on('mouseover', function() {
        mOverRed($(this));
    }).on('mouseleave', function() {
        mOutRed($(this));
    }).on('click', function(event) {
        tabClick($(this), event);
    });
    
            
    $('#diceButton').on('click', function() {
        socket.emit("getGame", "diceRoller");
    });*/
    
    
    
});