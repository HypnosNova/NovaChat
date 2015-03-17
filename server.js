var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	users = [];

//使用www文件夹作为视图层的目录
app.use('/', express.static(__dirname + '/www'));

server.listen(process.env.PORT || 3000);

//socket.io的使用
io.sockets.on('connection', function(socket) {
	//当新用户连接的时候
	socket.on('login', function(nickname) {
		if (users.indexOf(nickname) > -1) {
			socket.emit('nickExisted');
		} else {
			socket.userIndex = users.length;
			socket.nickname = nickname;
			users.push(nickname);
			socket.emit("loginSuccess");
			socket.join(nickname+"p");
			//socket.join('to_'+nickname+"_Msg");
			io.sockets.emit('系统消息', nickname, users.length, users, 'login');
		};
	});
	socket.on('relogin', function(nickname) {
		if (users.indexOf(nickname) > -1) {
			socket.emit('nickExisted');
		} else {
			socket.userIndex = users.length;
			socket.nickname = nickname;
			users.push(nickname);
			socket.emit("loginSuccess");
			socket.join(nickname+"p");
			//socket.join('to_'+nickname+"_Msg");
			io.sockets.emit('系统消息', nickname, users.length, users, 'login');
		};
	});
	//当有用户离开时
	socket.on('disconnect', function() {
		users.splice(socket.userIndex, 1);
		socket.broadcast.emit('系统消息', socket.nickname, users.length, users, 'logout');
	});
	//当用户发送信息
	socket.on('postMsg', function(msg, color) {
		socket.broadcast.emit('newMsg', socket.nickname, msg, color);
	});
	//用户发送图片
	socket.on('img', function(imgData, color) {
		socket.broadcast.emit('newImg', socket.nickname, imgData, color);
	});
	//私聊，向每个私人监听传消息
	socket.on('privateMsg', function(userlist,msg, color) {
		for(var i=0;i<userlist.length;i++){
			socket.broadcast.to(userlist[i]+"p").emit('newMsg', socket.nickname, msg, color);
		}
	});
	//私聊传图片，向每个私人监听传图片
	socket.on('privateImg', function(userlist,msg, color) {
		for(var i=0;i<userlist.length;i++){
			socket.broadcast.to(userlist[i]+"p").emit('newImg', socket.nickname, msg, color);
		}
	});
});