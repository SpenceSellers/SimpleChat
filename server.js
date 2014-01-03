var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app)
var io = require('socket.io').listen(server);
var fs = require('fs');

server.listen(5555);

app.use(express.static(__dirname + "/static"));
app.get('/', function(req, res){
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
});

/* Sends a message to every connected client. */
function tellAll(username, message){
    io.sockets.clients().forEach(function(so){
	so.emit('chat', {user: sanitize_HTML(username),
			 msg: sanitize_HTML(message)});
    });
}
function tellSocket(socket, username, message){
    socket.emit('chat', {user:username, msg:sanitize_HTML(message)});
}

/* Hopefully renders any text safe for display, as long as the text is
   placed in a sensible place (Not in an attributes field, etc.) */
function sanitize_HTML(text){
    if (text == undefined){
	return "";
    }
    text = text.replace("&", "&amp ")
	.replace(/</g, "&lt")
	.replace(/>/g, "&gt");
//	.replace("/", "&#x2F ")
//	.replace("\"", "&quot")
//	.replace("'", "&#x27 ");

    return text;
}

function validate_username(name){
    if (name.length > 50){
	return {valid: false, reason: "Username is too long."};
    }
    if (name.toLowerCase() === "server"){
	return {valid: false, reason: "Username cannot be 'Server'."};
    }
    if (name === ""){
	return {valid: false, reason: "Username cannot be empty."};
    }
    return {valid: true};
}
    
io.sockets.on('connection', function (socket) {
    tellSocket(socket, "Server", "You have connected.");
    socket.on('login', function(data){
	if (typeof data.user != "string") return;
	var validation_results = validate_username(data.user);
	if (validation_results.valid === true){
	    socket.set('username', data.user);
	    tellAll("Server", data.user + " has logged in.");
	} else {
	    tellSocket(socket, "Server", "You have been disconnected due to an invalid username: " + validation_results.reason);
	    socket.disconnect();
	}
	
    });
    socket.on('chatback', function (data) {
	if (typeof data.msg != "string"){
	    return;
	}
	if (data.msg == ""){
	    tellSocket(socket, "Server", "Messages must have content.");
	    return;
	}
	socket.get("username", function(err, name){
	    tellAll(name, data.msg);
	});
    });
    socket.on('setnick', function (data){
	if (typeof data.user != "string") return;
	socket.get("username", function(err, oldname){
	    var validation_results = validate_username(data.user);
	    if (validation_results.valid === true){
		tellAll("Server",
			oldname +
			" has changed their name to " +
			data.user);
		socket.set("username", data.user);
	    } else {
		tellSocket(socket, "Server", "Your new username is invalid: " + validation_results.reason);
	    }
		
	});
	
    });
    socket.on('disconnect', function(){
	socket.get("username", function(err, name){
	    tellAll("Server", name + " has disconnected.");
	});
    });
    
});
