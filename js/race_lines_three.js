/*
TODO

sine / morph in y positions

horizontal movement euler + quarternion rotation around in between axis

speed up change colours

*/

var race_lines_three = function() {

	var isMouseDown = false;

	var emptySlot = "emptySlot", top = "top", bottom = "bottom";

	var camera, scene, projector, renderer, group;
	var mouse = {x: 0, y: 0};
	var camPos = {x: 0, y: 0, z: 10};

	var sw = window.innerWidth, sh = window.innerHeight;
	var theta = 0;
	var cols = 20;
	var rows = 16;
	var gap = 20;
	var size = {
		width: 100,
		height: 30,
		depth: 150,
	}
	var planeOffset = 250;
	var allRowsDepth = rows * (size.depth + gap);
	var allColsWidth = cols * (size.depth + gap);

	var speedNormal = 4;
	var speedFast = 34;
	var speed = speedNormal;

	var boxes = {
		bottom: [],
		top: []
	};
	var boxes1d = [];


	function num(min, max) { return Math.random() * (max - min) + min; }

	function draw(props) {

		var colours = {
			slow: {
				r: num(0, 0.2),
				g: num(0.5, 0.9),
				b: num(0.3, 0.7)
			},
			fast: {
				r: num(0.9, 1.0),
				g: num(0.1, 0.7),
				b: num(0.2, 0.5)
			}
		}

		var uniforms = {
			red: { type: "f", value: colours.slow.r},
			green: { type: "f", value: colours.slow.g},
			blue: { type: "f", value: colours.slow.b},
			distanceX: { type: "f", value: 1.0},
			distanceZ: { type: "f", value: 1.0},
			pulse: { type: "f", value: 0},
			speed: { type: "f", value: speed},
		};

		var material = new THREE.ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		});

		var geometry = new THREE.BoxGeometry(props.width, props.height, props.depth);
		var object = new THREE.Mesh(geometry, material);
		object.colours = colours;
		return object;
	}


	function init() {

		scene = new THREE.Scene();
		// fog doesn't work for shaders - custom solution with distance calculations instead
		// scene.fog = new THREE.FogExp2(0x002000, 0.001);

		camera = new THREE.PerspectiveCamera( 100, sw / sh, 1, 10000 );
		scene.add( camera );

		// lights don't work either - out of the box anyway, not sure how to feed into shader
		// var lightAbove = new THREE.DirectionalLight(0xff8080, 2);
		// lightAbove.position.set(0, 1, 0.25).normalize();
		// scene.add( lightAbove );

		group = new THREE.Group();
		scene.add(group);

		renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.setSize( sw, sh );
		// renderer.setClearColor( scene.fog.color );

		for (var j = 0, jl = rows; j < jl; j++) {
			boxes.bottom[j] = [];
			boxes.top[j] = [];
			for (var i = 0, il = cols; i < il; i++) {
				boxes.bottom[j][i] = emptySlot;
				boxes.top[j][i] = emptySlot;
			};
		};

		function createBox() {
			var xi = Math.floor(Math.random() * cols), xai = xi;
			var yi = Math.random() > 0.5 ? 1 : -1, yai = yi === -1 ? bottom : top;
			var zi = Math.floor(Math.random() * rows), zai = zi;

			var x = (xi - cols / 2) * (size.width + gap);
			var y = yi * planeOffset;
			var z = zi * (size.depth + gap);

			if (boxes[yai][zai][xai] === emptySlot) {
				var box = draw(size);
				box.position.y = y;
				box.isWarping = false;
				box.offset = {x: x, z: 0};
				box.posZ = z;

				boxes[yai][zai][xai] = box;
				boxes1d.push(box);

				group.add(box);
			}
		}


		for (var i = 0, il = rows * cols; i < il; i++) {
			createBox();
		};

		document.body.appendChild(renderer.domElement);

		function listen(eventNames, callback) {
			for (var i = 0; i < eventNames.length; i++) {
				window.addEventListener(eventNames[i], callback);
			}
		}
		listen(["mousedown", "touchstart"], function(e) {
			e.preventDefault();
			isMouseDown = true;
		});
		listen(["mousemove", "touchmove"], function(e) {
			e.preventDefault();
			if (e.changedTouches && e.changedTouches[0]) e = e.changedTouches[0];
			mouse.x = (e.clientX / sw) * 2 - 1;
			mouse.y = -(e.clientY / sh) * 2 + 1;
		});

		listen(["mouseup", "touchend"], function(e) {
			e.preventDefault();
			isMouseDown = false;
		});

		render(0);

	}




	function move(x, y, z) {
		var box = boxes[y][z][x];

		if (box !== emptySlot) {

			box.position.x = box.offset.x;
			box.position.z = box.offset.z + box.posZ;

			if (box.position.z > 0) {
				box.posZ -= allRowsDepth;
			}

			// return;
			// if (isMouseDown) return;
			if (!box.isWarping && Math.random() > 0.999) {

				var dir = Math.floor(Math.random() * 5), xn = x, zn = z, yn = y, yi = 0, xo = 0, zo = 0;
				switch (dir) {
					case 0 : xn++; xo = 1; break;
					case 1 : xn--; xo = -1; break;
					case 2 : zn++; zo = 1; break;
					case 3 : zn--; zo = -1; break;
					case 4 :
						yn = (y === top) ? bottom : top;
						yi = (y === top) ? -1 : 1;

						break;
				}

				if (boxes[yn][zn] && boxes[yn][zn][xn] === emptySlot) {

					boxes[y][z][x] = emptySlot;

					box.isWarping = true;

					boxes[yn][zn][xn] = box;

					// con.log( box.offset.x,  box.offset.z);

					if (dir === 4) { // slide vertically
						TweenMax.to(box.position, 0.5, {
							y: yi * planeOffset
						});
					} else { // slide horizontally
						TweenMax.to(box.offset, 0.5, {
							x: box.offset.x + xo * (size.width + gap),
							z: box.offset.z + zo * (size.depth + gap),
						});
					}
					TweenMax.to(box.offset, 0.6, {
						onComplete: function() {
							box.isWarping = false;
						}
					});

				}
			}

		}
	}


	function render(time) {

		// theta += 0.01;

		speed -= (speed - (isMouseDown ? speedFast : speedNormal)) * 0.05;

		var box;
		// con.log(boxes);

		for (var b = 0, bl = boxes1d.length; b < bl; b++) {
			box = boxes1d[b];
			box.posZ += speed;

			// normalized z distance from camera
			var distanceZ = 1 - ((allRowsDepth - box.posZ) / (allRowsDepth) - 1);
			box.material.uniforms.distanceZ.value = distanceZ;

			// normalized x distance from camera (centre)
			var distanceX = 1 - (Math.abs(box.position.x)) / (allColsWidth / 3);
			box.material.uniforms.distanceX.value = distanceX;

			var colour = isMouseDown ? box.colours.fast : box.colours.slow;
			box.material.uniforms.red.value -= (box.material.uniforms.red.value - colour.r) * 0.1;
			box.material.uniforms.green.value -= (box.material.uniforms.green.value - colour.g) * 0.1;
			box.material.uniforms.blue.value -= (box.material.uniforms.blue.value - colour.b) * 0.1;

			if (Math.random() > 0.99995) {
				box.material.uniforms.pulse.value = 1;
			}
			box.material.uniforms.pulse.value -= box.material.uniforms.pulse.value * 0.1;

			// normalized speed
			box.material.uniforms.speed.value = (speed - speedNormal) / (speedFast - speedNormal);
			// if (b ==13) con.log(box.material.uniforms.speed.value);
		}

		for (var j = 0, jl = rows; j < jl; j++) { // iterate through rows: z
			for (var i = 0, il = cols; i < il; i++) { // iterate throw cols: x
				// move(boxes.bottom[j][i]);
				// move(boxes.top[j][i]);
				move(i, bottom, j);
				move(i, top, j);
			};
		};

		camPos.x -= (camPos.x - mouse.x * 400) * 0.02;
		camPos.y -= (camPos.y - mouse.y * 150) * 0.05;
		camPos.z = -100;
		camera.position.set(camPos.x, camPos.y, camPos.z);

		// camera.lookAt( scene.position );

		// camera.rotation.z = time * 0.0001;
		camera.rotation.y = camPos.x / -1000;
		camera.rotation.x = camPos.y / 1000;
		// camera.rotation.z = camPos.x / -2000;
		camera.rotation.z = (camPos.x - mouse.x * 400) / 2000;

		renderer.render( scene, camera );

		// if (time < 800)
			requestAnimationFrame( render );
	}

	var vertexShader = [
	"varying vec2 vUv;",
	"void main()",
	"{",
	"  vUv = uv;",
	"  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
	"  gl_Position = projectionMatrix * mvPosition;",
	"}"].join("");

	var fragmentShader = [
	// "uniform float time;",
	"uniform float red;",
	"uniform float green;",
	"uniform float blue;",
	"uniform float distanceZ;",
	"uniform float distanceX;",
	"uniform float pulse;",
	"uniform float speed;",

	"varying vec2 vUv;",

	// "float checkerRows = 8.0;",
	// "float checkerCols = 16.0;",


	"void main( void ) {",
	"  vec2 position = abs(-1.0 + 2.0 * vUv);",
	"  float edging = abs((pow(position.y, 5.0) + pow(position.x, 5.0)) / 2.0);",
	"  float perc = (0.2 * pow(speed + 1.0, 2.0) + edging * 0.8) * distanceZ * distanceX;",

	// "  float perc = distanceX * distanceZ;",
	// "  vec2 checkPosition = vUv;",
	// "  float checkerX = ceil(mod(checkPosition.x, 1.0 / checkerCols) - 1.0 / checkerCols / 2.0);",
	// "  float checkerY = ceil(mod(checkPosition.y, 1.0 / checkerRows) - 1.0 / checkerRows / 2.0);",
	// "  float checker = ceil(checkerX * checkerY);",
	// "  float r = checker;",
	// "  float g = checker;",
	// "  float b = checker;",

	// "  float perc = 1.0;",
	"  float r = red * perc + pulse;",
	"  float g = green * perc + pulse;",
	"  float b = blue * perc + pulse;",
	"  gl_FragColor = vec4( r, g, b, 1.0 );",
	"}"].join("");

	return {
		init: init,
		resize: function() {}
	}

};

define("race_lines_three", race_lines_three);