module.exports = function PlayerList() {
    var players = [];
    
    this.add = function(newPlayer) {
        players.push(newPlayer);
    }
    
    this.find = function(playerId) {
        var match = null;
        for (var i = 0; i < players.length; i++) {
            if (players[i].id == playerId) {
                match = players[i];
                break;
            }
        }
        return match;
    }
    
    this.remove = function(player) {
        var arrIndex = players.indexOf(player);
        
        if (arrIndex >= 0)
            players.splice(arrIndex, 1);
    }
    
    this.getAll = function() {
        return players;
    }
}