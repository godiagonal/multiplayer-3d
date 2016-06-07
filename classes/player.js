module.exports = function Player(id, name) {
    var scope = this;
    
    this.id = id;
    this.name = name;
    
    var pos = {
        x: 0, y: 0, z: 0
    };
    
    var rotation = {
        x: 0, y: 0
    }
    
    this.setPos = function(posObj) {
        pos.x = posObj.x;
        pos.y = posObj.y;
        pos.z = posObj.z;
    }
    
    this.setRotation = function(rotationObj) {
        rotation.x = rotationObj.x;
        rotation.y = rotationObj.y;
    }
    
    // returns an object that can be sent to a client
    this.clientFormat = function() {
        return {
            id: this.id,
            name: this.name,
            pos: pos,
            rotation: rotation
        }
    }
}