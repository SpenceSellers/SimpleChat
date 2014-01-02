var socket = io.connect(document.domain);
var notification_sound = new Audio("/notification.ogg");
function randUsername(){
    var num = Math.floor((Math.random()*1000)+1);
    return "Guest " + num;
}
function login(username){
    socket.emit('login', {user: username});
}
function changeNick(username){
    socket.emit('setnick', {user: username});
}

function playNotification(){
    notification_sound.play();
}

$(document).ready( function(){
    var start_name = randUsername();
    login(start_name);
    console.log("READY");
    $("#userfield").val(start_name);
    $("#username_form").submit(function(e){
	var username = $("#userfield").val();
	
	changeNick(username);
	return false;
    });
    $("#msgform").submit(function(e){
	var txt = $("#textinput").val();
	if (txt.length == 0) return false;
	$("#textinput").val('');
	socket.emit('chatback', {'msg':txt});
	return false;
    });
});

socket.on('chat', function (data) {
    $("#msgbox").append("<div class=\"message\"><strong>" + data.user + "</strong>" + ": " + data.msg + "<br\></div>");
    playNotification();
    $("#msgbox").scrollTop(1000000);
});
