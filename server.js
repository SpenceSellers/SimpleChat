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
   placed in a sensible place (Not in an attributes field, etc. */
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

function correct_username(name){
    name = name.substring(0,50); // Limit username length
    return name;
}
io.sockets.on('connection', function (socket) {
    socket.emit('chat', { user: 'Server', msg: 'You Have Connected' });
    socket.on('login', function(data){
	var correctname = correct_username(data.user);
	socket.set('username', correctname);
	tellAll("Server", correctname + " has logged in.");
    });
    socket.on('chatback', function (data) {
	if (data.msg == ""){
	    tellSocket(socket, "Server", "Messages must have content.");
	    return;
	}
	socket.get("username", function(err, name){
	    tellAll(name, data.msg);
	});
    });
    socket.on('setnick', function (data){
	socket.get("username", function(err, oldname){
	    var correctname = correct_username(data.user);
	    tellAll("Server",
		    oldname +
		    " has changed their name to " +
		    correctname);
	    socket.set("username", correctname);
	});
	
    });
    socket.on('disconnect', function(){
	socket.get("username", function(err, name){
	    tellAll("Server", name + " has disconnected.");
	});
    });
    
});
