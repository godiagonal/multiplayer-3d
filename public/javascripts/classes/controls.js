THREE.PointerLockControls = function (camera, player, world) {

    var scope = this;

    var messageInput = document.getElementById('txtMessage');

    camera.rotation.set(0, 0, 0);

    var pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    var yawObject = new THREE.Object3D();
    yawObject.position.y = 30;
    yawObject.add(pitchObject);

    var blocker = document.getElementById('blocker');
    var instructions = document.getElementById('instructions');
    var unlockButton = document.getElementById('btnStart');
    var messageInput = document.getElementById('txtMessage');

    var moveForward = false;
    var moveBackward = false;
    var moveLeft = false;
    var moveRight = false;

    var isOnObject = false;
    var canJump = false;

    var velocity = new THREE.Vector3();

    var caster = new THREE.Raycaster();

    var PI_2 = Math.PI / 2;

    var onEnterPress = function (event) {
        if (scope.enabled === false || event.keyCode !== 13) return;

        event.preventDefault();

        if (!isTyping())
            focusMessage();
        else
            blurMessage();
    }

    var onMouseMove = function (event) {
        if (scope.enabled === false) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;

        pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));

        player.setRotation({
            x: pitchObject.rotation.x,
            y: yawObject.rotation.y
        });
    };

    var onKeyDown = function (event) {
        if (isTyping()) return;

        switch (event.keyCode) {

        case 38: // up
        case 87: // w
            moveForward = true;
            break;

        case 37: // left
        case 65: // a
            moveLeft = true;
            break;

        case 40: // down
        case 83: // s
            moveBackward = true;
            break;

        case 39: // right
        case 68: // d
            moveRight = true;
            break;

        case 32: // space
            if (canJump) velocity.y += 5;
            break;

        }
    };

    var onKeyUp = function (event) {
        if (isTyping()) return;

        switch (event.keyCode) {

        case 38: // up
        case 87: // w
            moveForward = false;
            break;

        case 37: // left
        case 65: // a
            moveLeft = false;
            break;

        case 40: // down
        case 83: // s
            moveBackward = false;
            break;

        case 39: // right
        case 68: // d
            moveRight = false;
            break;

        }
    };

    this.enabled = false;

    this.getObject = function () {

        return yawObject;

    };

    this.isOnObject = function (boolean) {

        isOnObject = boolean;
        canJump = boolean;

    };

    this.getDirection = function () {

        // assumes the camera itself is not rotated

        var direction = new THREE.Vector3(0, 0, -1);
        var rotation = new THREE.Euler(0, 0, 0, "YXZ");

        return function (v) {

            rotation.set(pitchObject.rotation.x, yawObject.rotation.y, 0);

            v.copy(direction).applyEuler(rotation);

            return v;

        }

    }();

    this.getYaw = function () {
        return yawObject;
    }

    this.getPitch = function () {
        return pitchObject;
    }

    this.update = function (delta) {

        if (scope.enabled === false) return;

        checkCollisions();

        delta *= 0.1;

        velocity.x += (-velocity.x) * 0.08 * delta;
        velocity.z += (-velocity.z) * 0.08 * delta;

        velocity.y -= 0.2 * delta;

        if (moveForward) velocity.z -= 0.12 * delta;
        if (moveBackward) velocity.z += 0.12 * delta;

        if (moveLeft) velocity.x -= 0.12 * delta;
        if (moveRight) velocity.x += 0.12 * delta;

        if (isOnObject === true)
            velocity.y = Math.max(0, velocity.y);

        yawObject.translateX(velocity.x);
        yawObject.translateY(velocity.y);
        yawObject.translateZ(velocity.z);

        if (yawObject.position.y < 10) {

            velocity.y = 0;
            yawObject.position.y = 10;

            canJump = true;

        }

        player.setPos(yawObject.position);

    };

    // collision detection (only below player for now)

    var checkCollisions = function () {

        isOnObject = false;
        canJump = false;

        caster.ray.direction = new THREE.Vector3(0, -1, 0);
        caster.ray.origin.copy(yawObject.position);
        caster.ray.origin.y -= 10;

        var intersections = caster.intersectObjects(world.getObjects());

        if (intersections.length > 0) {

            var distance = intersections[0].distance;

            if (distance > 0 && distance < 10) {

                isOnObject = true;
                canJump = true;

            }

        }

    }

    // unlock screen

    var unlock = function () {
        scope.enabled = true;

        blocker.style.display = 'none';
    }

    // lock screen

    var lock = function (content) {
        scope.enabled = false;

        blocker.style.display = '-webkit-box';
        blocker.style.display = '-moz-box';
        blocker.style.display = 'box';

        instructions.style.display = '';

        blurMessage();
    }

    // init pointer lock

    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    var init = function () {

        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);
        document.addEventListener('keypress', onEnterPress, false);

        if (havePointerLock) {

            var element = document.body;

            var pointerlockchange = function (event) {

                if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
                    unlock();
                } else {
                    lock();
                }

            }

            var pointerlockerror = function (event) {
                instructions.style.display = '';
            }

            // Hook pointer lock state change events
            document.addEventListener('pointerlockchange', pointerlockchange, false);
            document.addEventListener('mozpointerlockchange', pointerlockchange, false);
            document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

            document.addEventListener('pointerlockerror', pointerlockerror, false);
            document.addEventListener('mozpointerlockerror', pointerlockerror, false);
            document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

            unlockButton.addEventListener('click', function (event) {

                instructions.style.display = 'none';

                // Ask the browser to lock the pointer
                element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

                if (/Firefox/i.test(navigator.userAgent)) {

                    var fullscreenchange = function (event) {

                        if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {

                            document.removeEventListener('fullscreenchange', fullscreenchange);
                            document.removeEventListener('mozfullscreenchange', fullscreenchange);

                            element.requestPointerLock();
                        }

                    }

                    document.addEventListener('fullscreenchange', fullscreenchange, false);
                    document.addEventListener('mozfullscreenchange', fullscreenchange, false);

                    element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

                    element.requestFullscreen();

                } else {

                    element.requestPointerLock();

                }

            }, false);

        } else {

            instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

        }
    }

    init();

};