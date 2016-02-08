var EventEmitter = require('events').EventEmitter;
var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var myEvents = new EventEmitter();


function hex_to_ascii(str1)  
 {  
    var hex  = str1.toString();  
    var str = '';  
    for (var n = 0; n < hex.length; n += 2) {  
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));  
    }  
    return str;  
 }  

var logged = false;
var device = "";
var user = "";
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
	if (req.body.user=="test" && req.body.pass=="test"){
		logged = true;
		user=req.body.user;
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
	console.log("Message reçu");
	evenement.emit('SigMessage', hex_to_ascii(req.body.data));
	console.log(req.body);
})
.get('/gotMail', function(req,res){
	res.render('gotMail.ejs');
});

io.sockets.on('connection', function(socket){

	evenement.on('SigMessage', function(message){
		socket.emit('message', message);
	});
});

io.on('connection', function(socket){
	console.log('nouveau client');
});

