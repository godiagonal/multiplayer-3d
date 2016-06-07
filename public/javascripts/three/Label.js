var LabelPlugin = {
  labels: [],
  init: function() {},
  add: function(l) {this.labels.push(l);},
  remove: function(l) {
   this.labels = this.labels.filter(function (label) {
     return label != l;
   });
  },
  render: function() {
    for (var i=0; i<this.labels.length; i++) {
      var args = Array.prototype.slice.call(arguments);
      this.labels[i].render.apply(this.labels[i], args);
    }
  },
  find: function(obj) {
      var match = null;
        for (var i = 0; i < this.labels.length; i++) {
            if (this.labels[i].object == obj) {
                match = this.labels[i];
                break;
            }
        }
        return match;
  }
};

var OriginalWebGLRenderer = THREE.WebGLRenderer;
THREE.WebGLRenderer = function(parameters) {
   var orig = new OriginalWebGLRenderer(parameters);
   orig.addPostPlugin(LabelPlugin);
   return orig;
};

var OriginalCanvasRenderer = THREE.CanvasRenderer;
THREE.CanvasRenderer = function(parameters) {
   var orig = new OriginalCanvasRenderer(parameters);
   orig.addPostPlugin(LabelPlugin);
   return orig;
};

function Label(object, content, className, align, duration) {
  this.object = object;
  this.content = content;
  this.className = className;
  this.align = align;
  this.show = true;
    
  this.removeTimeout;
  if (duration) this.remove(duration);

  this.el = this.buildElement();
  LabelPlugin.add(this);
}

Label.prototype.buildElement = function() {
  var el = document.createElement('div');
  el.textContent = this.content;
  el.className = this.className;
  el.style.maxWidth = (window.innerWidth * 0.25) + 'px';
  el.style.maxHeight = (window.innerHeight * 0.25) + 'px';
  document.body.appendChild(el);
  return el;
};

Label.prototype.render = function(scene, cam) {
  if (this.show) {
    this.object.updateMatrix();
    this.object.updateMatrixWorld();
    cam.updateMatrix();
    cam.updateMatrixWorld();
    
    var p3d = new THREE.Vector3();
    p3d.setFromMatrixPosition( this.object.matrixWorld );
    
    var frustum = new THREE.Frustum();
    var cameraViewProjectionMatrix = new THREE.Matrix4();
    
    cam.matrixWorldInverse.getInverse( cam.matrixWorld );
    cameraViewProjectionMatrix.multiplyMatrices( cam.projectionMatrix, cam.matrixWorldInverse );
    frustum.setFromMatrix( cameraViewProjectionMatrix );
    
    var onScreen = frustum.containsPoint(p3d);
    
    if (onScreen) {
      var projector = new THREE.Projector(),
          pos = p3d.project(cam),//projector.projectVector(p3d, cam),
          width = window.innerWidth,
          height = window.innerHeight,
          w = this.el.offsetWidth,
          h = this.el.offsetHeight,
          margin = 0;
      
      switch (this.align) {
        case 'left':
            margin = 0;
            break;
        case 'right':
            margin = w;
            break;
        case 'center':
            margin = w/2;
            break;
      }
        
      this.el.style.top = '' + (height/2 - height/2 * pos.y - h) + 'px';
      this.el.style.left = '' + (width/2 * pos.x + width/2 - margin) + 'px';
      this.el.style.display = 'block';
    }
    else {
      this.el.style.display = 'none';
    }
  }
  else {
    this.el.style.display = 'none';
  }
};

Label.prototype.setContent = function(content) {
  this.content = content;
  this.el.textContent = this.content;
};

Label.prototype.remove = function(delay) {
  var that = this;
  if (delay) return setTimeout(function(){that.remove();}, delay * 1000);
  if (this.el.parentNode === document.body)
    document.body.removeChild(this.el);
  return LabelPlugin.remove(this);
};
