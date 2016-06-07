var socket = io.connect('192.168.0.101:3000');

var world,
    self,
    players = new PlayerList(),
    messages = new MessageList(),
    messageHistory = new MessageList(),
    historyCurrent = -1,
    speechRange = 300;

// checkSession --> checkSessionCallback --> init world & wait for user input -->
// input submit --> initNewSession --> initSelf --> init controls -->
// init others --> update self (loop) --> start button click --> unlocked

window.onload = function() {
    
    var newPlayerDiv = document.getElementById('newPlayer');
    var startGameDiv = document.getElementById('startGame');
    var chatDiv = document.getElementById('chat');
    
    socket.on('checkSessionCallback', function(data) {
        //console.log('checkSessionCallback');
        
        world = new World();
        
        newPlayerDiv.style.display = 'block';
        
        document.getElementById('txtName').focus();
    });
    
    socket.on('initSelf', function(data) {
        //console.log('initSelf');
        
        self = new Player(data.id, data.name);
        players.add(self);
        
        world.initControls(self);
        
        newPlayerDiv.style.display = 'none';
        startGameDiv.style.display = 'block';
        chatDiv.style.display = 'block';
        
        document.getElementById('btnStart').focus();
        
        // request other players
        socket.emit('initOthers', '');
        
        // start transmiting movement
        updateSelf();
    });
    
    socket.on('initOthersCallback', function(data) {
        //console.log('initOthersCallback');
        
        for (var i = 0; i < data.length; i++) {
            var newPlayer = new Player(data[i].id, data[i].name);
            
            players.add(newPlayer);
            world.addObject(newPlayer.getThreeObj());
            
            newPlayer.nameLabel = new Label(newPlayer.getNameObj(), data[i].name, 'nameLabel', 'center');
        }
    });
    
    socket.on('newPlayer', function(data) {
        //console.log('newPlayer');
        
        // prevent new players if world hasn't loaded
        if (world != undefined) {
            var newPlayer = new Player(data.id, data.name);
            
            players.add(newPlayer);
            world.addObject(newPlayer.getThreeObj());
            
            newPlayer.nameLabel = new Label(newPlayer.getNameObj(), data.name, 'nameLabel', 'center');
            
            var newMessage = new Message(data.name + ' joined the game', { name: 'Server' }, Date.now());
            
            addMessage(newMessage);
        }
    });
    
    socket.on('updatePlayer', function(data) {
        //console.log('updatePlayer');
        
        var player = players.find(data.id);
        
        if (player !== null) {
            player.setPos(data.pos);
            player.setRotation(data.rotation);
            
            var distance = world.getDistanceTo(player.getThreeObj());
            
            if (distance <= speechRange)
                player.nameLabel.show = true;
            else
                player.nameLabel.show = false;
        }
    });
    
    socket.on('updatePlayerName', function(data) {
        //console.log('updatePlayerName');
        
        var player = players.find(data.id);
        
        if (player !== null) {
            var oldName = player.name;
            
            player.name = data.name;
            
            prevLabel = LabelPlugin.find(player.getNameObj());
            
            // label change will not affect the sender
            if (prevLabel !== null) {
                prevLabel.remove();
                
                player.nameLabel = new Label(player.getNameObj(), player.name, 'nameLabel', 'center');
            }
            
            // fake the Message class
            var newMessage = new Message(oldName + ' changed name to ' + player.name, { name: 'Server' }, Date.now());
            
            addMessage(newMessage);
        }
    });
    
    socket.on('removePlayer', function(data) {
        //console.log('removePlayer');
        
        var player = players.find(data.id);
        
        if (player !== null) {
            player.nameLabel.remove();
            player.nameLabel = null;
            
            players.remove(player);
            world.removeObject(player.getThreeObj());
        }
    });
    
    socket.on('newMessage', function(data) {
        //console.log('newMessage');
        
        var sender = players.find(data.sender.id);
        
        if (sender === null)
            sender = data.sender;
        
        else if (sender !== self) {
            var distance = world.getDistanceTo(sender.getThreeObj());
            
            if (distance <= speechRange) {
                prevLabel = LabelPlugin.find(sender.getSpeechObj());
                
                if (prevLabel !== null) {
                    prevLabel.remove();
                }
                
                var duration = 3 + data.text.length * 0.05
                var newMessageLabel = new Label(sender.getSpeechObj(), data.text, 'speechBubble', 'left', duration);
            }
        }
        
        var newMessage = new Message(data.text, sender, data.date);
            
        messages.add(newMessage);
        addMessage(newMessage);
    });
    
    socket.on('serverResponse', function(data) {
        //console.log('serverResponse');
        
        addServerResponse(data);
    });

    document.getElementById('btnSendName').addEventListener('click', initNewSession);
    document.getElementById('txtName').addEventListener('keypress', function(e){
        if (e.keyCode == 13) { // enter
            e.preventDefault();
            initNewSession();
        }
    });
    
    document.getElementById('txtMessage').addEventListener('keypress', function(e){
        if (e.keyCode == 13) { // enter
            e.preventDefault();
            sendMessage();
        }
    });
    
    document.getElementById('txtMessage').addEventListener('keydown', function(e){
        switch (e.keyCode) {
            case 38: // up
                e.preventDefault();
                historyPrev();
                break;
            case 40: // down
                historyNext();
                break;    
        }
    });
    
    checkSession();
    
}

function trim(str) {
  return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

function checkSession() {
    socket.emit('checkSession', '');
}

function initNewSession() {
    socket.emit('initNewSession', document.getElementById('txtName').value);
}

function updateSelf() {
    socket.emit('updatePlayer', self.serverFormat());
    
    setTimeout(updateSelf, 20);
}

function focusMessage() {
    document.getElementById('txtMessage').focus();
}

function blurMessage() {
    document.getElementById('txtMessage').blur();
}

function isTyping() {
    return (document.getElementById('txtMessage') === document.activeElement);
}

function sendMessage() {
    var message = trim(document.getElementById('txtMessage').value.replace(/(\r\n|\n|\r)/gm,''));
    
    if (message.length > 0) {
        socket.emit('sendMessage', message);
        
        document.getElementById('txtMessage').value = '';
        
        messageHistory.add(message);
        historyCurrent = messageHistory.getAll().length;
    }
}

function addMessage(message) {
    var className = '';
    if (message.sender.name == 'Server')
        className = 'server';
    
    var html =  '<tr class="' + className + '">';
        html +=   '<td class="timestamp">' + moment(message.date).format('HH:mm') + '</td>';
        html +=   '<td><span class="userName">' + message.sender.name + ':</span> ' + message.text.replace(/(\r\n|\n|\r)/gm,'<br>') + '</td>';
        html += '</tr>';
    
    document.getElementById('messageList').innerHTML += html;
    document.getElementById('messagesInner').scrollTop = document.getElementById('messagesInner').scrollHeight;
}

function addServerResponse(response) {
    var html =  '<tr>';
        html +=   '<td colspan="2" class="' + response.type + '">' + response.text + '</td>';
        html += '</tr>';
    
    document.getElementById('messageList').innerHTML += html;
    document.getElementById('messagesInner').scrollTop = document.getElementById('messagesInner').scrollHeight;
}

function historyPrev() {
    var h = messageHistory.getAll();
    
    if (historyCurrent > 0) {
        document.getElementById('txtMessage').value = h[historyCurrent-1];
        historyCurrent -= 1;
    }
}

function historyNext() {
    var h = messageHistory.getAll();
        
    if (historyCurrent < h.length-1) {
        document.getElementById('txtMessage').value = h[historyCurrent+1];
        historyCurrent += 1;
    }
}