var EventEmitter = require('events').EventEmitter;
var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var myEvents = new EventEmitter();


var users = [
	{
		userType : "user",
		username : "david",
		pass : "test"
	},
	{
		userType : "postman",
		username : "postier",
		pass : "test"
	}
];

var messages = [];
var livraisons = [];
var stat = [];

function makeStat(){
	var spub = 0;
	var smail= 0;
	var sopened= 0;
	var sclosed= 0;
	var sunknow= 0;
	
	for(i = 0; i < messages.length; i++){
		if(messages[i].dataType == 'mail'){
			smail += 1;
		}else if(messages[i].dataType == 'pub'){
			spub += 1;
		}else if(messages[i].dataType == 'open'){
			sopened += 1;
		}else if(messages[i].dataType == 'close'){
			sclosed += 1;
		}else{
			sunknow += 1;
		}
	}
	return {
		mail : smail,
		pub : spub,
		opened : sopened,
		closed : sclosed,
		delivery : livraisons.length
	};
	
}

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
	messages.push({ 'dataType': dataAscii, 'time': new Date().toLocaleString() })	
	if (dataAscii == 'mail') {
		evenement.emit('SigMessage', 'message');
	}
})
.post('/delivery' ,  function(req, res){
	res.sendStatus(200);
	console.log(req.body.data);
	livraisons.push({ 'horaire': req.body.data, 'time': new Date().toLocaleString() })
	horaire = req.body.data;
	evenement.emit('deliveryMessage', horaire);
})
.get('/Mail', function(req,res){
	res.render('Mail.ejs', {messages : messages });
})
.get('/Delivery', function(req,res){
	res.render('Delivery.ejs', {livraisons : livraisons});
})
.get('/Option', function(req,res){
	res.render('Option.ejs');
})
.get('/Stat', function(req,res){
	stat = makeStat();
	console.log(stat);
	res.render('Stat.ejs', {stat : stat});
});

io.sockets.on('connection', function(socket){

	evenement.on('SigMessage', function(message){
		socket.emit('message', message);
	});
	evenement.on('deliveryMessage', function(horaire){
		console.log(horaire);
		socket.emit('delivery', horaire);
	});
});

io.on('connection', function(socket){
	console.log('nouveau client');
});
