// must solve this for...
define("bill_stevens", () => { // ... and jan

	const stage = document.createElement("div");

	var camera, controls, scene, projector, renderer, holder;
	const mouse = { x: 0, y: 0 };
	const sw = window.innerWidth, sh = window.innerHeight;
	var theta = 0, gamma = 0;
	const dim = 4;
	const size = 30;
	const cubes = [];

	const available = Array(Math.pow(dim, 3)).fill(0);
	const occupied = Array(Math.pow(dim, 3)).fill(0);

	const position = (grid) =>
		// (index) => (index - grid / 2 + 0.5) * size;
		(index) => index * size;

	const populate = (array, index) => array[index] ++;

	const getPositionFromIndex = (grid) =>
		(index) => {
			var x = index % grid;
			var y = Math.floor(index / grid) % grid;
			var z = Math.floor(index / (grid * grid));
			return {x, y, z};
		}

	const getIndexFromPosition = ({x,y,z}) =>
		x + y * dim + z * dim * dim;

	const pieces = [
		/*
		{
			id: 0,
			structure: [
				[
					[1,1],
					[1,0],
				],[
					[1,0],
					[0,0],
				]
			]
		},
		{
			id: 1,
			structure: [
				[
					[1,1,1],
					[1,0,0],
				]
			]
		},
		*/
		{
			id: 3,
			structure: [
				[
					[1,1,1,1],
				]
			]
		}
	].map((piece) =>{
		// calculate dimensions (bounds)
		const { structure } = piece;
		var w = 0, h = 0, d = 0;
		structure.forEach((xLayer, x) => {
			w = Math.max(w, x + 1);
			xLayer.forEach((yRow, y) => {
				h = Math.max(h, y + 1);
				yRow.forEach((piece, z) => {
					d = Math.max(d, z + 1);
				});
			});
		});
		return Object.assign(piece, {
			dimensions: {w, h, d},
		});
	});
	// console.log(pieces);

	const cube = (scale) => {
		const d = scale * size;
		const material = new THREE.MeshLambertMaterial({color: 0});
		const geometry = new THREE.BoxGeometry(d, d, d);
		return new THREE.Mesh(geometry, material);
	}

	const getBlock = () => {

		const test = occupied.slice();
		// con.log(test);
		const piece = pieces[Math.floor(Math.random() * pieces.length)];
		const { structure } = piece;

		const p = position(dim);

		const hex = colours.getNextColour();
		const mutated = colours.mutateColour(hex, 30);
		const colour = Number("0x" + mutated.substr(1));

		// trial container to dump blocks in and transform them
		const containerTest = new THREE.Group();
		// post transformation, get transformed coordinates and create blocks in here.
		const containerReal = new THREE.Group();

		holder.add(containerTest);
		holder.add(containerReal);

		containerTest.x = rand.getInteger(0, dim - piece.dimensions.w);
		containerTest.y = rand.getInteger(0, dim - piece.dimensions.h);
		containerTest.z = rand.getInteger(0, dim - piece.dimensions.d);

		containerTest.rotation.set(
			rand.getInteger(-1, 1) * Math.PI / 2,
			rand.getInteger(-1, 1) * Math.PI / 2,
			rand.getInteger(-1, 1) * Math.PI / 2,
		)

		// create initial guess at 0,0
		structure.forEach((xLayer, x) => {
			xLayer.forEach((yRow, y) => {
				yRow.forEach((piece, z) => {
					if (piece) {
						var c = cube(0.6);
						c.position.set(p(x), p(y), p(z));
						c.material.color.setHex(colour);
						containerTest.add(c);
					}
				});
			});
		});

		// now shift container within bounds
		containerTest.position.set(
			containerTest.x * size,
			containerTest.y * size,
			containerTest.z * size
		);
		containerTest.updateMatrixWorld();

		// calculate absolute positions using THREE's nested bodies calculation.
		var min = {x: 10, y: 10, z: 10};
		var max = {x: 0, y: 0, z: 0};

		const vectors = containerTest.children.map((c, index) => {
			const vector = new THREE.Vector3();
			vector.setFromMatrixPosition(c.matrixWorld);
			const cleansed = {};
			Object.entries(vector).forEach(([key,value]) => {
				// remove infinitely small numbers created by matrix rotations.
				var v = ((value > 0 && value < 0.001) || (value < 0 && value > -0.001)) ? 0 : value;
				cleansed[key] = v / size;
				// work out if they are out of bounds.
				min[key] = Math.min(min[key], cleansed[key]);
				max[key] = Math.max(max[key], cleansed[key]);
			});
			return cleansed;
		});

		// con.log("min", min, "min", max);
		const shift = (newV, oldV, d) => {
			if (min[d] < 0) {
				// con.log(`shifting ${d} up:`, - min[d]);
				newV[d] = oldV[d] - min[d];
			} else if (max[d] > dim - 1) {
				// con.log(`shifting ${d} down:`, - (max[d] - dim + 1));
				newV[d] = oldV[d] - (max[d] - dim + 1);
			} else {
				newV[d] = oldV[d];
			}
			return newV;
		}

		// randomised rotation puts blocks outside of bounds,
		// shift them back into bounds using min and max.
		const shifted = vectors.map((oldV) => {
			var newV = {};
			shift(newV, oldV, "x");
			shift(newV, oldV, "y");
			shift(newV, oldV, "z");
			return newV;
		})

		shifted.forEach((v) => {
			const positionIndex = getIndexFromPosition(v);
			populate(test, positionIndex);
		});

		// con.log("test", test);

		if (test.some((item) => item > 1)) {
			return con.log("invalid!");
		}

		// populate real!
		shifted.forEach((v) => {
			const {x, y, z} = v;
			const c = cube(0.95);
			c.position.set(p(x), p(y), p(z));
			c.material.color.setHex("0x50ff50");
			containerReal.add(c);
			const positionIndex = getIndexFromPosition(v);
			populate(occupied, positionIndex);
		});

	}

	const init = () => {

		colours.getRandomPalette();

		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera( 50, sw / sh, 1, 10000 );
		camera.position.set( 0, 100, 500 );
		scene.add( camera );

		var light = new THREE.DirectionalLight( 0xffffff, 2 );
		light.position.set( 1, 1, 1 ).normalize();
		scene.add( light );

		var light = new THREE.DirectionalLight( 0xff00ff, 2 );
		light.position.set( -1, 0, 0 ).normalize();
		scene.add( light );

		renderer = new THREE.WebGLRenderer();
		renderer.setSize( sw, sh );

		controls = new THREE.OrbitControls( camera, renderer.domElement );

		holder = new THREE.Group();
		scene.add(holder);

		// generate grid dots
		let p = position(dim + 1);
		for (var i = 0; i < Math.pow(dim + 1, 3); i++) {
			var c = cube(0.1);
			var {x, y, z} = getPositionFromIndex(dim + 1)(i);
			c.position.set(p(x) - size / 2, p(y) - size / 2, p(z) - size / 2);
			c.material.color.setHex(0xff7700);
			cubes.push(c);
			holder.add(c);
		}

		stage.appendChild(renderer.domElement);

		document.addEventListener( 'keydown', onKeyDown, false );

		render();
		animate();
		attemptBlock();
	}

	let a = 0;
	const attemptBlock = () => {
		getBlock();

		if (occupied.every((item) => item === 1)) {
			return con.log("we're done here!!", occupied);
		}

		// con.log(available, occupied);
		a++
		if (a > 10) return; //1e3) return;
		setTimeout(attemptBlock, 20);
	}

	const onKeyDown = ( event ) => {
		// con.log(event);
		return;

		switch (event.key) {
			case "ArrowLeft" : b.x --; break;
			case "ArrowUp" : b.y --; break;
			case "ArrowRight" : b.x ++; break;
			case "ArrowDown" : b.y ++; break;
		}


		const mesh = b;

		TweenMax.to(mesh.position, 0.5, {
			x: b.x * size,
			y: b.y * size,
			z: b.z * size,
		});

		// event.preventDefault();
	}

	const render = () => {
		controls.update();
		camera.lookAt( scene.position );
		renderer.render( scene, camera );
	}

	const animate = () => {
		requestAnimationFrame( animate );
		render();
	}

	return {stage, init};
});