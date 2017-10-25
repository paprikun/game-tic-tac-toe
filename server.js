//var app = require('express')();

var express      = require('express')
var cookieParser = require('cookie-parser')
 
var app = express()
app.use(cookieParser())


var http = require('http').Server(app);
var io = require('socket.io')(http);
var room01_arr = [];
var room01_arr_lenght = 0;

var authorization_users = {};



app.get('/', function(req, res) {
	
	var login = req.cookies.userName;
	var pass = req.cookies.key;
	
	console.log('login = ' + login, 'pass = ' + pass);
	query_work('nosocket', login, pass, 'mail', 'check_login',  res, 'index.html');

});


app.get('/map/map.html', function(req, res) {
	console.log('map.html');
	var addr = req.connection.remoteAddress;


query_work('nosocket', 'user', '1234', 'mail', 'check_login',  res, './map/map.html');

	
});
var wait_reg = [];			
var wait_reg_lenght = 0;


	function delete_wait_reg(code){
	wait_reg.forEach(function(itemZ, iZ, wait_reg){	
	var str = itemZ.split(':');
	if (str[0] == code){
			delete wait_reg[iZ]; 
			console.log("timeout:delete code");			
	}
	});	
}	
// socket.on - приём сообщения
// io.emit - отправка сообщения
io.on('connection', function(socket) {
	//console.log('ip=' + socket.handshake.address);

	//var pass = 'password1234';	
	//var key = generate_key(pass.length);
	
	//var crypt = coded(pass, key);
	//var uncrypt = uncoded(crypt, pass);
	//console.log('key = ' + key);
	//console.log('coded = ' + crypt);
	//console.log('uncoded = ' + uncrypt);
	

	
	socket.on ('disconnect', function () {
				room01_arr.forEach(function(itemZ, iZ, room01_arr){	
						var statusline = itemZ.split(':');
						if (statusline[1] == socket.id){
							delete room01_arr[iZ];//удалить комнату
							if ( statusline[2] != '№2'){
								io.to(statusline[2]).emit('chat message', 'msg', 'user', 'opponent1 exit');//сообщим оставшемуся игроку что его оппонент вышел
							}
						}
						if (statusline[2] == socket.id){//в комнате остался первый игрок
							delete room01_arr[iZ];//удалить комнату
							io.to(statusline[1]).emit('chat message', 'msg', 'user', 'opponent2 exit');//сообщим оставшемуся игроку что его оппонент вышел
						}
				});
				console.log('disconnect user = ' + socket.id);
    });
  socket.on('chat message', function(msg, name, dodo) {
	if (dodo == 'room01_update'){
		room01_arr.forEach(function(item, i, room01_arr) {
			socket.emit('chat message', item, name, dodo);
		});
			socket.emit('chat message', 'end room list', name, dodo);
	}else if (dodo == 'room01_create'){
		var element_available = 1;
		room01_arr.forEach(function(itemA, iterA, room01_arr){
			var namespace = room01_arr[iterA].split(":");
			if (namespace[0] == msg){
				console.log('eerr2 ' + namespace[0] + ' ' + msg);
				element_available = 0;
			}
		});
			if (element_available==1 && msg != ''){
				var newitem = socket.id;
				console.log('create room = '  + msg  +' user = ' + newitem);
				room01_arr[room01_arr_lenght] = msg +':' + newitem + ':' + '№2' + ':' + '1' + ':' + '0'; // имя_комнаты:игрок_1:игрок_2:присутствие_1:присутствие_2
				room01_arr_lenght++;
				//socket.emit('chat message', msg, name, dodo);
			}if (element_available == 0){
				console.log('eerr3 ');
				socket.emit('chat message', 'room is exist', 'name', 'room is exist');
			}
	}else if (dodo == 'room01_connect'){ 
		//запомнить id
		var ids = socket.id;
		console.log('connect to room = ' + msg + ' user = ' + ids);
		room01_arr.forEach(function(itemZ, iter, room01_arr){	
			var room_name = msg;//msg = room_12345
				if(itemZ.indexOf(room_name) != -1 && itemZ.indexOf(ids)== -1){ //если не содержит ids
							if (itemZ.indexOf('№2') != -1){ //есть ли свободное место
								var arrtemp = itemZ.split(':');
								room01_arr[iter]  = arrtemp[0]  + ':' + arrtemp[1] + ':' + ids + ':' + arrtemp[3] + ':' + '1';
								io.to(arrtemp[1]).emit('chat message', 'msg', ids ,'connect to you'); //уведомление второго пользователя что мы присоединились
								console.log('roomline = ' + room01_arr[iter] );
							}else{
									console.log('no place for you');
									io.to(ids).emit('chat message', 'msg', 'name','no place for you'); //уведомление о том что места нет
							}
				}
			});
	}else if (dodo == "cancel connect"){ // ids user = name
		io.to(name).emit('chat message', 'msg', 'user','opponent does not want play with you'); //уведомление о том что места нет
	}
	else if (dodo == "yes here"){
		var idst = socket.id;
		console.log(idst + " is here");
		room01_arr.forEach(function(itemZ, iZ, room01_arr){	
			if (itemZ.indexOf(idst) != -1){
				var strtemp = itemZ.split(':');
				if (idst == strtemp[1]){
					room01_arr[iZ] = strtemp[0] +':' + strtemp[1] +':' + strtemp[2] +':' + '1' +':' + strtemp[4];
				}else if (idst == strtemp[2]){
					room01_arr[iZ] = strtemp[0] +':' + strtemp[1] +':' + strtemp[2] +':' + strtemp[3] +':' + '1';
				}
			}
		});
	}
		else if (dodo == "input"){
			var login = msg;
			var pass = name;
			query_work(socket,login, pass, 'mail','check_login');
	}else if (dodo == "forgot"){
			var mail = msg;
			query_work(socket, '','', mail, 'find_login_by_mail');
			
			
			
			
	}else if (dodo == "close session"){
		var login = msg;
		var ip_temp = socket.handshake.address;
		if (login != null){
		close_session(login, ip_temp);
		}
		
	}
	else if (dodo == "registration_content"){
		var login_mail = msg;
		var pass = name;
		var temp = login_mail.split(":");
		var login = temp[0];
		var mail = temp[1];
		query_work(socket,login, pass, mail, 'find');
	}else if (dodo == "registration_finish"){
		var true_code = false;
		if (msg != ""){
			wait_reg.forEach(function(itemZ, iZ, wait_reg){
				var str = itemZ.split(':');
					if (str[0] == msg){
					delete wait_reg[iZ];
					console.log("correct:delete code");
					true_code = true;
					query_work(socket, str[1], str[2], str[3], 'add');
				}
			});
		}
		if (true_code == false){
					socket.emit('chat message', 'uncorrect code', '', 'registration_finish');
		}
	}else if (dodo == "forgot_code"){
		
		var temp = msg.split(":");
		var code = temp[1];
		var mail = temp[0];

		//change pass
		var true_code = false;
		if (code != ""){
			wait_reg.forEach(function(itemZ, iZ, wait_reg){
				var str = itemZ.split(':');
					if (str[0] == code){
					
					
					//socket.emit('chat message', 'correct code', '', 'registration_finish');	
					socket.emit('chat message', 'correct code', str[1], 'registration_finish');
					
					
					delete wait_reg[iZ];
					console.log("correct:delete code");
					true_code = true;
					console.log('correct code for new pass');
					//query_work(socket, '', '', mail, 'find_login_by_mail');
				}else{
					
					socket.emit('chat message', 'uncorrect code', '', 'registration_finish');
					
				}
			});
		}
		if (true_code == false){
					socket.emit('chat message', 'uncorrect code', '', 'registration_finish');
		}
	}else if (dodo == "forgot_finish"){
		var mail = msg;
		var pass = name;
		query_work(socket, '', pass, mail, 'change_pass');
		//query_work(socket, '','', mail, 'find_login_by_mail');
		
	


		
	}
	
	
	
	else{
		//socket.emit('chat message', msg, name, dodo);
		console.log("<< msg = " + msg + " name = " + name + " dodo = " + dodo + " >>");
		if (dodo == "room01_coordinates"){
		var name_user = socket.id;
			room01_arr.forEach(function(itemX, ni, room01_arr){
				if (itemX.indexOf(name_user) != -1){	//есть комната с вашим id
					var arre = itemX.split(":");
							console.log('coodinates;');
							io.to(arre[1]).emit('chat message', msg, name, dodo); //отправка всем кто в комнате id
							if (arre[2] != '№2'){
							io.to(arre[2]).emit('chat message', msg, name, dodo); //отправка всем кто в комнате id						  
							}
				}
			});
		}
	}
  });
});
http.listen(8080, function() {
  console.log('listening on *:8080');
});
  function randomInteger(min, max) {
  var rand = min + Math.random() * (max - min)
  rand = Math.round(rand);
  return rand;
}
function query_work(socket, login, pass, mail, command, res, ref){

	if (socket != 'nosocket' && !check_input_simbols(socket,login, pass,mail))
	{
		return false;
	}

	var mysql      = require('mysql');
	var connection = mysql.createConnection({
						  host     : 'localhost',
						  user     : 'john',
						  password : 'pass1234',
						  database : 'users'
		});
	connection.connect();
	var search_true = false;
	var queryString;
	if (command == 'find'){
	queryString = "SELECT * FROM table_name WHERE login = " + "'" + login + "'" +  "OR mail = " + "'" + mail + "'" + ";" ;
			connection.query(queryString, function(err, rows, fields){		
					 if (rows[0] != null){
								socket.emit('chat message', 'This login or mail is already exist', '', 'registration_content');
						 }else{
								sendmail(socket,login,pass,mail);
						 }
			});
	}else if(command == 'check_login'){
			queryString = "SELECT password FROM table_name WHERE login = " + "'" + login + "'" +  ";" ;
			connection.query(queryString, function(err, rows, fields){		
					if (err){
						console.log('no access to database');
						}else{
					 if (rows[0] != null){
						 
						 //var key2 = uncoded(pass, rows[0].password);
						 //var temp = coded(rows[0].password, key2);
						 			
						 
						 if (rows[0].password == pass)
							{

								if (socket != 'nosocket'){
								socket.emit('chat message', 'correct', '', 'input');
								}else{
									
									console.log('correct password and login');
									res.sendfile(ref);
								}
							}
							else
								{
									if (socket != 'nosocket'){
									socket.emit('chat message', 'no correct password or login', '', 'input');
									}else{
										
										console.log('no correct password or login ' + login + ' ' + pass );
										res.sendfile('index.html');
								}
								}
						 }else
								{
									if (socket != 'nosocket'){
									socket.emit('chat message', 'no correct password or login', '', 'input');
									}else{
										
										console.log('no correct password or login ' + login + ' ' + pass );
										res.sendfile('index.html');
								}
								}
						}
			});
	}else if(command == 'add'){
			if (mail != '' && login != '' && pass != ''){
				queryString = "INSERT INTO table_name SET mail = " + "'" + mail + "'" + ","  + "login = " + "'" + login + "'" + "," + "password = "  + "'" + pass  + "'" + ";";
				connection.query(queryString, function(err, rows, fields){	
					if (!err){	
						socket.emit('chat message', 'correct code', '', 'registration_finish');
					}
				});	
			}
	}else if (command == 'change_pass'){
		queryString = "UPDATE table_name SET password = " + "'" + pass + "'" + "WHERE  mail = "  + "'" + mail  + "'" + ";";
		connection.query(queryString, function(err, rows, fields){
			if (!err){
				console.log('success change pass');
				socket.emit('chat message', 'success', 'change pass', 'forgot_finish');
			}else{
				socket.emit('chat message', 'fail', 'can not change pass', 'forgot_finish');	
			}
			
			
		});
	}else if (command == 'find_login_by_mail'){
		queryString = "SELECT login FROM table_name WHERE mail = " + "'" + mail + "'" +  ";" ;
		connection.query(queryString, function(err, rows, fields){		
					 if (rows[0] != null){	
						var login_find = rows[0].login;
						console.log('success login_find = ' + login_find);
						sendmail(socket, login_find, '', mail);
					 }else{
						
						socket.emit('chat message', 'fail', 'can not find login', 'forgot_finish');
					 }
		});
	}
		
		
		
	
	connection.end();
}
function sendmail(socket,login, password, mail){
													var nodemailer = require('nodemailer');
													var transporter = nodemailer.createTransport('SMTP', {
														   host: 'smtp.mail.ru',
															secureConnection: true,
															port: 465,
															auth: {
																user: 'automystery@mail.ru', //Sender Email id
																pass: 'sevilia@2' //Sender Email Password
															}
													})
													// setup e-mail data with unicode symbols
													
													//var code = randomInteger(10000, 1000000);
													var code = generate_key(20);
													var mailOptions = {
														from: 'automystery@mail.ru', // sender address
														to: mail, // list of receivers
														subject: 'registration on mystery20.h1n.ru', // Subject line
													   // text: resultBuffer // plaintext body
														html: '<b>Hello</b> <br>This message is automatically generated.<br> Code: ' + code // html body
													};
													// send mail with defined transport object
													transporter.sendMail(mailOptions, function(error, info){
														if(error){
															socket.emit('chat message', 'Uncorrect mail', '', 'registration_content');
															return console.log(error);
														}
														
															
															
															wait_reg.push(code + ':' + login + ':' + password + ':' + mail);
															setTimeout(function() { delete_wait_reg(code) } ,60000);
															
															socket.emit('chat message', 'code was sent to your mail', '', 'registration_content');
															
																
															
														
															
																
														
													});
}

function check_input_simbols(socket,login, pass, mail){
		//Проверка на возможные символы при вводу	
		var reg_pass =/[\W]/g;
		var reg_mail =/[\W]/g;		
		var reg_login =/[\W]/g;	
		var reg_login_ = login.match(reg_login); //Логин может содержать только латинские символы, цифры и знак подчеркивания
		var pp = 	pass.replace(/[\!\@\#\$\%\^\&\*\(\)]/g, '');	
		var reg_pass_ = pp.match(reg_pass); //Пароль может содержать только латинские символы, цифры и знак подчеркивания и 10 спецсимволов
		var tt = mail.replace('@', ''); //Почта может содержать только латинские символы, цифры и знак подчеркиванияб знак "." и "@"
		tt = tt.replace('\.', '');
		var reg_mail_ = tt.match(reg_mail);		
		var true_simbol = true;
		if (reg_login_ != null){
			if (login.length >= 20 || login == ''){
			error_registration(socket,'Uncorrect symbols of login');
			true_simbol = false;
		}}
		if (reg_pass_ != null){
			if (pass.length >= 50 || pass == ''){
			error_registration(socket,'Uncorrect symbols of pass');
			true_simbol = false;
		}}
		if (reg_mail_ != null){
			if (mail.length >= 50 || mail==''){
			error_registration(socket,'Uncorrect symbols of mail');			
			true_simbol = false;
		}}	
		return true_simbol;
}

function error_registration(socket, error){
	
	socket.emit('chat message', error, '', 'error symbols');
	
}

function generate_key(len){
	 key ='' ;
	var str = 'qwertyuiopasdfghjklzxcvbnm1234567890!@#$%^&*()QWERTYUIOPASDFGHJKLZXCVBNM';
	for (var i=0; i<len; i++){
		key += str[randomInteger(0,71)];
	}//console.log('key = ' + key);

	return key;
}
function coded(text,key){

	var hex0 = [];
	var hex1 = [];
	var hex2 = [];
	var result ='';

	for (var i=0; i<text.length; i++){
		
		hex0[i] = (text.charCodeAt(i)).toString(16);  
		hex1[i] = (key.charCodeAt(i)).toString(16);  
		hex2[i] = parseInt(hex0[i],16 )+ parseInt(hex1[i],16);

		result+=hex2[i].toString(16);;
	}

	return result;
}
function uncoded(text,key)
{
	var hex0 = [];
	var hex1 = [];
	var hex2 = [];
	var result ='';


	for (var i =0; i<key.length; i++){
		
		hex0.push(key.charCodeAt(i).toString(16));
		hex1.push(text[i*2] + text[i*2+1]);
		hex2.push(parseInt(hex1[i],16) - parseInt(hex0[i],16));		
		result+=hex2asc(hex2[i].toString(16));;
	}
	return result;
}
function hex2asc(pStr) {
        tempstr = '';
        for (b = 0; b < pStr.length; b = b + 2) {
            tempstr = tempstr + String.fromCharCode(parseInt(pStr.substr(b, 2), 16));
        }
        return tempstr;
 }
function open_session(login, ip){
	
	if (authorization_users[ip] != ''){
		console.log('users with login = ' + login + ' and ip = ' + ip + ' open session');
	}else{
		console.log('error open session');
	}
}
function close_session(login, ip){

if (authorization_users[ip] != ''){
	var temp = authorization_users[ip] ;
	delete authorization_users[ip];
	console.log('users with login = ' + temp+ ' and ip = ' + ip + ' close session');
}
	
}	
	

  function randomInteger(min, max) {
  var rand = min + Math.random() * (max - min)
  rand = Math.round(rand);
  return rand;
}


