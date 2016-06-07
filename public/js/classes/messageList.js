var MessageList = function() {
    var messages = [];
    
    this.add = function(message) {
        messages.push(message);
    }
    
    this.getAll = function() {
        return messages;
    }
}