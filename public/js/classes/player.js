var Player = function (id, name) {
    var scope = this;

    this.id = id;
    this.name = name;
    this.nameLabel;

    var textureLoader = new THREE.TextureLoader();
    
    var generateMesh = function () {

        var size = 20;
        var geometry = new THREE.CubeGeometry(size, size, size);
        
        //var material = new THREE.MeshBasicMaterial({color: '#555555'});
        var material = new THREE.MeshPhongMaterial({
            map: textureLoader.load('img/textures/player-map.jpg')
        });

        var rightArm = [new THREE.Vector2(0, .666), new THREE.Vector2(.5, .666), new THREE.Vector2(.5, 1), new THREE.Vector2(0, 1)];
        var leftArm = [new THREE.Vector2(.5, .666), new THREE.Vector2(1, .666), new THREE.Vector2(1, 1), new THREE.Vector2(.5, 1)];
        var top = [new THREE.Vector2(0, .333), new THREE.Vector2(.5, .333), new THREE.Vector2(.5, .666), new THREE.Vector2(0, .666)];
        var bottom = [new THREE.Vector2(.5, .333), new THREE.Vector2(1, .333), new THREE.Vector2(1, .666), new THREE.Vector2(.5, .666)];
        var back = [new THREE.Vector2(0, 0), new THREE.Vector2(.5, 0), new THREE.Vector2(.5, .333), new THREE.Vector2(0, .333)];
        var face = [new THREE.Vector2(.5, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, .333), new THREE.Vector2(.5, .333)];

        geometry.faceVertexUvs[0] = [];

        geometry.faceVertexUvs[0][0] = [rightArm[0], rightArm[1], rightArm[3]];
        geometry.faceVertexUvs[0][1] = [rightArm[1], rightArm[2], rightArm[3]];

        geometry.faceVertexUvs[0][2] = [leftArm[0], leftArm[1], leftArm[3]];
        geometry.faceVertexUvs[0][3] = [leftArm[1], leftArm[2], leftArm[3]];

        geometry.faceVertexUvs[0][4] = [top[0], top[1], top[3]];
        geometry.faceVertexUvs[0][5] = [top[1], top[2], top[3]];

        geometry.faceVertexUvs[0][6] = [bottom[0], bottom[1], bottom[3]];
        geometry.faceVertexUvs[0][7] = [bottom[1], bottom[2], bottom[3]];

        geometry.faceVertexUvs[0][8] = [back[0], back[1], back[3]];
        geometry.faceVertexUvs[0][9] = [back[1], back[2], back[3]];

        geometry.faceVertexUvs[0][10] = [face[0], face[1], face[3]];
        geometry.faceVertexUvs[0][11] = [face[1], face[2], face[3]];

        return new THREE.Mesh(geometry, material);
        
    }

    var speechObj = new THREE.Object3D();
    speechObj.position.set(-15, 15, 0);

    var nameObj = new THREE.Object3D();
    nameObj.position.set(0, 15, 0);

    var pitchObj = generateMesh(); // rotation up and down

    var threeObj = new THREE.Object3D(); // rotation left and right

    threeObj.add(speechObj);
    threeObj.add(nameObj);
    threeObj.add(pitchObj);

    this.setPos = function (posObj) {
        threeObj.position.x = posObj.x;
        threeObj.position.y = posObj.y;
        threeObj.position.z = posObj.z;
    }

    this.setRotation = function (rotationObj) {
        threeObj.rotation.y = rotationObj.y;
        pitchObj.rotation.x = rotationObj.x;
    }

    this.getRotation = function () {
        return {
            x: pitchObj.rotation.x,
            y: threeObj.rotation.y,
            z: 0
        }
    }

    this.getThreeObj = function () {
        return threeObj;
    }

    this.getSpeechObj = function () {
        return speechObj;
    }

    this.getNameObj = function () {
        return nameObj;
    }

    // returns an object that can be sent to the server
    this.serverFormat = function () {
        return {
            id: this.id,
            name: this.name,
            pos: threeObj.position,
            rotation: {
                x: pitchObj.rotation.x,
                y: threeObj.rotation.y
            }
        }
    }

}