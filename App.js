var EventEmitter = require('events').EventEmitter;
var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var myEvents = new EventEmitter();


var users = [
	{
		type : "user",
		username : "david",
		pass : "test"
	},
	{
		type : "postman",
		username : "postier",
		pass : "test"
	}
];

var messages = [];

function hex_to_ascii(str1)  
 {  
    var hex  = str1.toString();  
    var str = '';  
    for (var n = 0; n < hex.length; n += 2) {  
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));  
    }  
    return str;  
 }

 function checkAccount(username, pass){
 	for(var i in users){
 		console.log(users[i], username, pass);
 		if (users[i].username == username && users[i].pass == pass) {
 			return users[i];
 		};
 	}
 	console.log("test");
 	return null;
 }

var logged = false;
var device = "";
var user = null;
var ErreurLogin = "";
//crée un nouvel événement
var evenement = new EventEmitter();

//crée une application express
var app =  express();
//crée un nouveau server http
var server = require('http').createServer(app);
//crée un nouveau système de socket
var io = require('socket.io').listen(server);

server.listen(8000);

app.use(session({secret: 'test'}))
.use( express.static("public"))
.use(bodyParser.urlencoded({ extended: true }))
.use(bodyParser.json())
.get( '/', function(req, res){
	res.render('login.ejs', {Erreur: ErreurLogin });
})

.post('/checkLogin', function(req, res){
	user = checkAccount(req.body.user, req.body.pass);
	if (user != null){
		logged = true;
		console.log(user['type']);
		res.redirect('/accueil');
	}
	else{
		res.redirect('/');
		ErreurLogin = "Erreur d'identifiant";
	}
})
.get('/accueil', function(req,res){
	if (logged==false) {
		res.redirect('/');
		ErreurLogin="Vous n'êtes pas identifié"
	}
	else
	{
		res.render('accueil.ejs');
	}	
})
.post('/update' ,  function(req, res){
	res.sendStatus(200);
	var dataAscii = hex_to_ascii(req.body.data);
	console.log(dataAscii);
	messages.push({ 'type': dataAscii, 'time': new Date().toLocaleString() })	
	if (dataAscii == 'mail') {
		evenement.emit('SigMessage', 'message');
	}
})
.get('/Mail', function(req,res){
	console.log(messages);
	res.render('Mail.ejs', {messages : messages });
})
.get('/Delivery', function(req,res){
	res.render('Delivery.ejs');
})
.get('/Option', function(req,res){
	res.render('Option.ejs');
})
.get('/Stat', function(req,res){
	res.render('Stat.ejs');
});

io.sockets.on('connection', function(socket){

	evenement.on('SigMessage', function(message){
		socket.emit('message', message);
	});
});

io.on('connection', function(socket){
	console.log('nouveau client');
});

