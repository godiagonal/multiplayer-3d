module.exports = function MessageList() {
    var messages = [];
    
    this.add = function(message) {
        messages.push(message);
    }
    
    this.getAll = function() {
        return messages;
    }
    
    this.getLatest = function() {
        return 1;
    }
}