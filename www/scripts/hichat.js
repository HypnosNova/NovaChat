var hideSysMsg = false,
	hearAll = true,
	speakAll = true;
$("#hideSysMsg").click(function() {
	hideSysMsg = !hideSysMsg;
})
$("#hearAll").click(function() {
	hearAll = !hearAll;
})
$("#speakAll").click(function() {
	speakAll = !speakAll;
})
var selfName = "www"; //自己的名字

window.onload = function() {
	var hichat = new HiChat();
	hichat.init();
};
var HiChat = function() {
	this.socket = null;
};
//判断是否刚进入，这样要将先前的用户名字都要放到列表里
var isFirst = true;
HiChat.prototype = {
	init: function() {
		var that = this;
		this.socket = io.connect();
		this.socket.on('connect', function() {
			document.getElementById('info').textContent = '输入一个昵称：';
			document.getElementById('nickWrapper').style.display = 'block';
			document.getElementById('nicknameInput').focus();
		});
		this.socket.on('nickExisted', function() {
			document.getElementById('loginWrapper').style.display = 'block';
			document.getElementById('info').textContent = '该昵称被别人抢走了，请换一个。';
		});
		this.socket.on('loginSuccess', function() {
			$("#userList").empty();
			$("#userList").append('<li><label>在线用户列表<div class="right"><span id="status">&nbsp</span></div></label></li>');
			selfName = document.getElementById('nicknameInput').value;
			document.title = 'Nova Chat | ' + selfName;
			document.getElementById('loginWrapper').style.display = 'none';
			document.getElementById('messageInput').focus();

		});
		this.socket.on('error', function(err) {
			if (document.getElementById('loginWrapper').style.display == 'none') {
				document.getElementById('status').textContent = '连接失败！';
			} else {
				document.getElementById('info').textContent = '连接失败！';
			}
		});
		//用户加入或离开聊天室
		this.socket.on('系统消息', function(nickName, userCount, users, type) {
			if (hideSysMsg) {
				return;
			}
			var msg = nickName + (type == 'login' ? ' 加入' : ' 离开');
			//当加入时，在用户列表添加一条
			if (type == 'login') {
				if (isFirst) {
					$("#userList").append('<li id="_' + nickName + '"><div style="left"><a href="#">' + nickName + '</a></div><div class="right" style="margin-top:-36px;margin-right:5px;"><img src="content/listen.png" style="width:28px;float:left;margin-right:7px"/><img src="content/talk.png" style="width:28px;float:left;margin-right:4px"/></div></li>');
				} else {
					$("#userList").append('<li id="_' + nickName + '"><div style="left"><a href="#" >' + nickName + '</a></div>' + '<div class="right" style="margin-top:-36px;margin-right:5px;"><input type="checkbox" name="userListHearCheckbox" id="listen_' + nickName + '" />' + '<label for="listen_' + nickName + '" class="check-box" style="float:left;margin-right:10px"></label><input type="checkbox" name="userListTalkCheckbox" id="talk_' + nickName + '" />' + '<label for="talk_' + nickName + '" class="check-box" style="float:left;margin-right:5px"></label> ' + '</div></li>');
				}

				if (isFirst) {
					isFirst = false;
					for (var i = 0; i < users.length - 1; i++) {
						$("#userList").append('<li id="_' + users[i] + '"><div style="left"><a href="#" >' + users[i] + '</a></div>' + '<div class="right" style="margin-top:-36px;margin-right:5px;"><input type="checkbox" name="userListHearCheckbox" id="listen_' + users[i] + '" />' + '<label for="listen_' + users[i] + '" class="check-box" style="float:left;margin-right:10px"></label><input type="checkbox" name="userListTalkCheckbox" id="talk_' + users[i] + '" />' + '<label for="talk_' + users[i] + '" class="check-box" style="float:left;margin-right:5px"></label> ' + '</div></li>');
					}
				}
			} else {
				//如果用户离开则删掉对应的列表
				$("#_" + nickName).remove();
			}
			that._displayNewMsg('系统消息 ', msg, 'red');
			document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' ');
		});
		this.socket.on('newMsg', function(user, msg, color) {
			if (!hearAll) {
				//如果不打算听所有人的话，则统计要接听的用户
				if(!$("#listen_"+user).is(":checked")){
					return;
				}
			}
			that._displayNewMsg(user, msg, color);
		});

		this.socket.on('newImg', function(user, img, color) {
			that._displayImage(user, img, color);
		});

		this.socket.on('disconnect', function() {
			isFirst = true;
			that._displayNewMsg('系统消息 ', "你已经和服务器断开。<br/>请检查您的网络连接。<br/>系统将尝试重新连接服务器。", 'red');
		});

		this.socket.on('reconnect', function() {
			var nickName = document.getElementById("nicknameInput").value;
			if (nickName.trim().length > 7) {
				document.getElementById('info').textContent = '昵称长度应当小于等于7';
				return;
			}
			if (nickName.trim().length != 0) {
				that.socket.emit('relogin', nickName.trim());
			} else {
				document.getElementById('nicknameInput').focus();
			};
			//console.log("重新连接到服务器");
		});

		function loginIn() {
			var nickName = document.getElementById("nicknameInput").value;
			if (nickName.trim().length > 7) {
				document.getElementById('info').textContent = '昵称长度应当小于等于7';
				return;
			}
			if (nickName.trim().length != 0) {
				that.socket.emit('login', nickName.trim());
			} else {
				document.getElementById('nicknameInput').focus();
			};
		}
		document.getElementById('loginBtn').addEventListener('click', function() {
			loginIn();
		}, false);
		document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
			if (e.keyCode == 13) {
				loginIn();
			};
		}, false);
		//发送消息
		document.getElementById('sendBtn').addEventListener('click', function() {
			var nickName = selfName;
			var messageInput = document.getElementById('messageInput'),
				msg = "<br/>" + messageInput.value.replaceAll(" ", "&nbsp").replaceAll("<", "&lt").replaceAll(">", "&gt").replaceAll("\n", "<br/>").replaceAll("\t", "&nbsp&nbsp&nbsp&nbsp"),
				color = document.getElementById('colorStyle').value;
			messageInput.value = '';
			messageInput.focus();
			if (msg.trim().length != 0) {
				if (speakAll) {
					that.socket.emit('postMsg', msg, color);
				} else {
					//如果是私聊消息，则先统计发送名单
					var userlist = new Array();
					var userli = document.getElementsByName("userListTalkCheckbox");
					for (var i = 0; i < userli.length; i++) {
						if ($(userli[i]).is(":checked")) {
							var idtmp = $(userli[i]).attr("id");
							userlist.push(idtmp.substring(idtmp.indexOf('_') + 1));
						}
					}
					that.socket.emit('privateMsg', userlist, msg, color);
				}
				that._displayNewMsg('【' + nickName + '】', msg, color);
				return;
			};
		}, false);
		//发送html
		document.getElementById('sendBtn2').addEventListener('click', function() {
			var nickName = selfName;
			var messageInput = document.getElementById('messageInput'),
				msg = "<br/>" + messageInput.value,
				color = document.getElementById('colorStyle').value;
			messageInput.value = '';
			messageInput.focus();
			if (msg.trim().length != 0) {
				if (speakAll) {
					that.socket.emit('postMsg', msg, color);
				} else {
					//如果是私聊消息，则先统计发送名单
					var userlist = new Array();
					var userli = document.getElementsByName("userListTalkCheckbox");
					for (var i = 0; i < userli.length; i++) {
						if ($(userli[i]).is(":checked")) {
							var idtmp = $(userli[i]).attr("id");
							userlist.push(idtmp.substring(idtmp.indexOf('_') + 1));
						}
					}
					that.socket.emit('privateMsg', userlist, msg, color);
				}
				that._displayNewMsg('【' + nickName + '】', msg, color);
				return;
			};
		}, false);
		document.getElementById('messageInput').addEventListener('keyup', function(e) {
			var nickName = selfName;
			var messageInput = document.getElementById('messageInput'),
				msg = "<br/>" + messageInput.value.replaceAll(" ", "&nbsp").replaceAll("<", "&lt").replaceAll(">", "&gt").replaceAll("\n", "<br/>").replaceAll("\t", "&nbsp&nbsp&nbsp&nbsp"),
				color = document.getElementById('colorStyle').value;
			if (e.keyCode == 13 && window.event.ctrlKey && msg.trim().length != 0) {
				messageInput.value = '';
				if (speakAll) {
					that.socket.emit('postMsg', msg, color);
				} else {
					//如果是私聊消息，则先统计发送名单
					var userlist = new Array();
					var userli = document.getElementsByName("userListTalkCheckbox");
					for (var i = 0; i < userli.length; i++) {
						if ($(userli[i]).is(":checked")) {
							var idtmp = $(userli[i]).attr("id");
							userlist.push(idtmp.substring(idtmp.indexOf('_') + 1));
						}
					}
					that.socket.emit('privateMsg', userlist, msg, color);
				}
				that._displayNewMsg('【' + nickName + '】', msg, color);
			};
		}, false);
		document.getElementById('clearBtn').addEventListener('click', function() {
			document.getElementById('historyMsg').innerHTML = '';
		}, false);
		document.getElementById('sendImage').addEventListener('change', function() {
			var nickName = selfName;
			if (this.files.length != 0) {
				var ireg = /image\/.*/i;
				var file = this.files[0],
					reader = new FileReader(),
					color = document.getElementById('colorStyle').value;
				if (!file.type.match(ireg)) {
					alert("该文件格式不是图片格式");
					return;
				}
				if (!reader) {
					that._displayNewMsg('系统消息', '!your browser doesn\'t support fileReader', 'red');
					this.value = '';
					return;
				};
				reader.onload = function(e) {
					this.value = '';
					that.socket.emit('img', e.target.result, color);
					that._displayImage(nickName, e.target.result, color);
				};
				reader.readAsDataURL(file);
			};
		}, false);
		this._initialEmoji();
		document.getElementById('emoji').addEventListener('click', function(e) {
			var emojiwrapper = document.getElementById('emojiWrapper');
			emojiwrapper.style.display = 'block';
			e.stopPropagation();
		}, false);
		document.body.addEventListener('click', function(e) {
			var emojiwrapper = document.getElementById('emojiWrapper');
			if (e.target != emojiwrapper) {
				emojiwrapper.style.display = 'none';
			};
		});
		document.getElementById('emojiWrapper').addEventListener('click', function(e) {
			var target = e.target;
			if (target.nodeName.toLowerCase() == 'img') {
				var messageInput = document.getElementById('messageInput');
				messageInput.focus();
				messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
			};
		}, false);
	},
	_initialEmoji: function() {
		var emojiContainer = document.getElementById('emojiWrapper'),
			docFragment = document.createDocumentFragment();
		for (var i = 69; i > 0; i--) {
			var emojiItem = document.createElement('img');
			emojiItem.src = '../content/emoji/' + i + '.gif';
			emojiItem.title = i;
			docFragment.appendChild(emojiItem);
		};
		emojiContainer.appendChild(docFragment);
	},
	_displayNewMsg: function(user, msg, color) {
		var container = document.getElementById('historyMsg'),
			msgToDisplay = document.createElement('div'),
			date = new Date().toTimeString().substr(0, 8),
			msgDiv = document.createElement('div'),
			msg = this._showEmoji(msg);
		$(msgToDisplay).addClass("row");
		//如果是自己发送的，靠右显示
		if (user == "【" + selfName + "】") {
			$(msgToDisplay).css("textAlign", "right");
		}else{
			user="【" + user + "】"
		}
		if (user.substr(0, 4) == "系统消息") {
			$(msgToDisplay).css("textAlign", "center");
		}
		$(msgDiv).addClass("columns");
		msgDiv.style.color = color || '#000';
		msgDiv.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg + '<div style="width:100%; height:2px; border-top:1px solid #999; clear:both;"></div>';
		msgToDisplay.appendChild(msgDiv);
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
	},
	_displayImage: function(user, imgData, color) {
		var container = document.getElementById('historyMsg'),
			msgToDisplay = document.createElement('p'),
			msgDiv = document.createElement('div'),
			date = new Date().toTimeString().substr(0, 8);
		$(msgToDisplay).addClass("row");
		if (user == selfName) {
			$(msgToDisplay).css("textAlign", "right");
		}
		if (user.substr(0, 4) == "系统消息") {
			$(msgToDisplay).css("textAlign", "center");
		}
		$(msgDiv).addClass("columns");
		msgDiv.style.color = color || '#000';
		msgDiv.innerHTML = "【" + user + "】" + '<span class="timespan">(' + date + '): </span> <br/>' + '<img src="' + imgData + '"/>';
		msgToDisplay.style.color = color || '#000';
		msgToDisplay.appendChild(msgDiv);
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
	},
	_showEmoji: function(msg) {
		var match, result = msg,
			reg = /\[emoji:\d+\]/g,
			emojiIndex,
			totalEmojiNum = document.getElementById('emojiWrapper').children.length;
		while (match = reg.exec(msg)) {
			emojiIndex = match[0].slice(7, -1);
			if (emojiIndex > totalEmojiNum) {
				result = result.replace(match[0], '[X]');
			} else {
				result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />'); //todo:fix this in chrome it will cause a new request for the image
			};
		};
		return result;
	}
};

String.prototype.replaceAll = function(reallyDo, replaceWith, ignoreCase) {
	if (!RegExp.prototype.isPrototypeOf(reallyDo)) {
		return this.replace(new RegExp(reallyDo, (ignoreCase ? "gi" : "g")), replaceWith);
	} else {
		return this.replace(reallyDo, replaceWith);
	}
}