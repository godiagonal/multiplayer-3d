// init --> animate & init controls

var World = function () {

    var scope = this;

    var camera, scene, renderer;
    var sky, sunSphere;
    var geometry, material, mesh;
    var controls, time = Date.now();

    var textureLoader = new THREE.TextureLoader();
    
    var objects = [];
    var player;
    
    var size = 200000; // determines world size

    this.addObject = function (threeObj) {
        scene.add(threeObj);
        objects.push(threeObj);
    }

    this.removeObject = function (threeObj) {
        scene.remove(threeObj);
    }

    this.getObjects = function () {
        return objects;
    }

    this.getDistanceTo = function (threeObj) {
        if (player)
            return player.getThreeObj().position.distanceTo(threeObj.position);
        else
            return 0;
    }

    var initSky = function () {

        // lights
        var light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 0.8, -1.5);
        scene.add(light);

        var light = new THREE.AmbientLight(0x404040, 0.75);
        scene.add(light);

        // sky mesh
        sky = new THREE.Sky();
        scene.add(sky.mesh);

        sunSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(20000, 16, 8),
            new THREE.MeshBasicMaterial({
                color: 0xffffff
            })
        );
        sunSphere.position.y = -700000;
        sunSphere.visible = false;
        scene.add(sunSphere);

        // sky params
        var distance = 400000;

        var uniforms = sky.uniforms;
        uniforms.turbidity.value = 10;
        uniforms.reileigh.value = 2;
        uniforms.luminance.value = 1;
        uniforms.mieCoefficient.value = 0.005;
        uniforms.mieDirectionalG.value = 0.8;

        var theta = Math.PI * (0.48 - 0.5);
        var phi = 2 * Math.PI * (0.25 - 0.5);

        sunSphere.position.x = distance * Math.cos(phi);
        sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
        sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);

        sunSphere.visible = true;

        sky.uniforms.sunPosition.value.copy(sunSphere.position);

    }

    var initGrass = function () {

        /*var grid = new THREE.GridHelper( size/10, 100, 0xffffff, 0xffffff );
        scene.add( grid );*/

        var mesh = new THREEx.GrassGround({
            width: size, // the width of the mesh, default to 1
            height: size, // the height of the mesh, default to 1
            segmentsW: 100, // the number of segment in the width, default to 1
            segmentsH: 100, // the number of segment in the height, default to 1
            repeatX: size/20, // the number of time the texture is repeated in X, default to 1
            repeatY: size/20, // the number of time the texture is repeated in Y, default to 1
            anisotropy: 16, // the anisotropy applied to the texture, default to 16
        });

        scene.add(mesh);

    }

    var initCubes = function () {

        var material = new THREE.MeshPhongMaterial({
            map: textureLoader.load('img/textures/cube-map.jpg')
        });

        var bricks = [new THREE.Vector2(0, .666), new THREE.Vector2(.5, .666), new THREE.Vector2(.5, 1), new THREE.Vector2(0, 1)];
        var clouds = [new THREE.Vector2(.5, .666), new THREE.Vector2(1, .666), new THREE.Vector2(1, 1), new THREE.Vector2(.5, 1)];
        var crate = [new THREE.Vector2(0, .333), new THREE.Vector2(.5, .333), new THREE.Vector2(.5, .666), new THREE.Vector2(0, .666)];
        var stone = [new THREE.Vector2(.5, .333), new THREE.Vector2(1, .333), new THREE.Vector2(1, .666), new THREE.Vector2(.5, .666)];
        var water = [new THREE.Vector2(0, 0), new THREE.Vector2(.5, 0), new THREE.Vector2(.5, .333), new THREE.Vector2(0, .333)];
        var wood = [new THREE.Vector2(.5, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, .333), new THREE.Vector2(.5, .333)];

        var materials = [bricks, crate, stone, wood];
        var geometries = [];
        
        for (var i = 0; i < materials.length; i++) {
            
            var geometry = new THREE.CubeGeometry(20, 20, 20);
            
            geometry.faceVertexUvs[0] = [];
        
            for (var j = 0; j < geometry.faces.length; j += 2) {
                geometry.faceVertexUvs[0][j] = [materials[i][0], materials[i][1], materials[i][3]];
                geometry.faceVertexUvs[0][j+1] = [materials[i][1], materials[i][2], materials[i][3]];
            }
            
            geometries.push(geometry);
            
        }
        
        for (var i = 0; i < 400; i++) {

            var randomIndex = Math.floor(Math.random() * geometries.length);
            var randomScale = Math.floor(Math.random() * 7) + 1;
            
            var mesh = new THREE.Mesh(geometries[randomIndex], material);
            
            mesh.scale.set(randomScale, randomScale, randomScale);
            mesh.position.x = Math.floor(Math.random() * 20 - 10) * 300;
            mesh.position.z = Math.floor(Math.random() * 20 - 10) * 300;
            mesh.position.y = Math.floor(Math.random() * 20) * 50 + 10;
            mesh.rotation.y = Math.random() * Math.PI;
            mesh.rotation.z = Math.PI / 2;
            
            scene.add(mesh);
            objects.push(mesh);

        }

    }


    // init world

    var init = function () {

        // add renderer

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // scene, cam etc

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000000);

        scene = new THREE.Scene();
        //scene.fog = new THREE.Fog(0xffffff, 500, 5000);

        window.addEventListener('resize', onWindowResize, false);

        // add sky (other objects will be added when player has chosen a name)

        initSky();

        // start animation loop
        
        animate();

    }
    
    this.initControls = function (player) {
        
        // add the rest of the world objects
        
        initGrass();
        initCubes();
        
        // init controls
        
        player = player;
        controls = new THREE.PointerLockControls(camera, player, this);
        scene.add(controls.getObject());
        
    }

    var onWindowResize = function () {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }

    var animate = function () {

        requestAnimationFrame(animate);

        if (controls)
            controls.update(Date.now() - time);

        renderer.render(scene, camera);

        time = Date.now();

    }
    
    init();

}