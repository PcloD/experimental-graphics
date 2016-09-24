const linked_line = function() {

	var tests = 1e4;
	var test = 0;
	var bucket = [];
	while (test++ < tests) {
		var r = rand.getInteger(0, 4);
		if (bucket[r]) { bucket[r]++; } else { bucket[r] = 1; }
	}
	console.log(bucket);


	const wid = 40, hei = 40, block = 10;
	const sw = wid * block;
	const sh = hei * block;
	const bmp = dom.canvas(sw, sh);
	const ctx = bmp.ctx;

	var occupied = {
		array: [],
		// twoD: [],
		oneD: []
	};
	var backup = {};
	const store = () => {
		backup.array = occupied.array.slice();
		backup.oneD = occupied.oneD.slice();
		// backup.twoD = occupied.twoD.slice();
	}
	const restore = () => {
		occupied.array = backup.array.slice();
		occupied.oneD = backup.oneD.slice();
		// occupied.twoD = backup.twoD.slice();
	}

	const makeItem = (options) => {
		const x = (options.x == undefined) ? rand.random() : options.x;
		const y = (options.y == undefined) ? rand.random() : options.y;
		let item = {
			x,
			y,
			prev: options.prev,
			next: options.next
		}

		// occupied.twoD[y][x] = item;
		occupied.oneD[y * wid + x] = item;
		occupied.array.push(item);

		return item;
	}

	var first, last;

	const getIndex = (x, y) => y * wid + x;

	const init = () => {


		for (var y = 0; y < hei; y++) {
			for (var x = 0; x < wid; x++) {
				occupied.oneD.push(-1);
				ctx.fillRect(x * block - 2 + block / 2, y * block - 2 + block / 2, 4, 4);
			}
		}

		var newItem, lastItem;
		for (var i = 0; i < hei; i++) {
			if (i < hei / 2) {
				x = i;
				y = hei / 2;//rand.getInteger(0, wid - 1);
			} else {
				x = wid / 2;
				y = i;
			}
			if (i == 0) { // first
				newItem = makeItem({x, y});
				first = newItem;
			} else{
				var n = makeItem({x, y, prev: lastItem});
				lastItem.next = n;
				newItem = n;
			}
			lastItem = newItem;
		}
		last = newItem;
		con.log(occupied.oneD);
		// con.log(occupied.twoD);
		render(0);
	}

	const insertItemAnywhere = () => {
		var index = rand.getInteger(0, occupied.array.length - 1);
		var item = occupied.array[index];
		// con.log("item", item)
		if (item && item.next && item.prev) {
			insertItemAfter(item);
		} else {
			// console.log("null", item);
		}
	}


	const checkDir = (x, y, dir) => {
		switch(dir) {
			case 0 /* up */ : y--; break;
			case 1 /* right */ : x++; break;
			case 2 /* down */ : y++; break;
			case 3 /* left */ : x--; break;
		}
		var index = getIndex(x, y);

		// ctx.fillStyle = "red";
		// ctx.fillRect(x * block - 1 + block / 1, y * block - 1 + block / 1, 2, 2);

		return {
			// ok: !!(occupied.twoD[y] && occupied.twoD[y][x] === -1),
			ok: x >= 0 && x < wid && y >= 0 && y < hei && occupied.oneD[index] === -1,
			x,
			y
		};
	}

	const checkPoints = (...points) => {
		for (var i = 0, il = points.length - 1; i < il; i++) {
			var p0 = points[i], p1 = points[i + 1];
			if (Math.abs(p0.x - p1.x) !== 0 && Math.abs(p0.y - p1.y) !== 0) {
				return false;
			}
		}

		if (points[0].x === points[1].x && points[1].x === points[2].x && points[2].x === points[3].x) return false;
		if (points[0].y === points[1].y && points[1].y === points[2].y && points[2].y === points[3].y) return false;

		return true;
	}

	const insertItemAfter = afterItem => {

		store();

		var prev = afterItem;
		var next = afterItem.next;

		// con.log(afterItem)
		var x = afterItem.x;
		var y = afterItem.y;
		var startDir = rand.getInteger(0, 3);
		var nextDir = rand.getInteger(0, 3);

		var pending0 = checkDir(x, y, startDir);
		var pending1 = checkDir(pending0.x, pending0.y, nextDir);
		var inline = checkPoints(prev, pending0, pending1, next);

		if (pending0.ok && pending1.ok && inline) {

			// con.log("pending0", pending0, pending1)
			var newItem0 = makeItem({x: pending0.x, y: pending0.y});

			var newItem1 = makeItem({x: pending1.x, y: pending1.y});

			prev.next = newItem0;

			newItem0.prev = prev;
			newItem0.next = newItem1;

			newItem1.prev = newItem0;
			newItem1.next = next;

			next.prev = newItem1;

		} else {
			restore();
		}

	}

	const render = (time) => {
		requestAnimationFrame(render);
		// setTimeout(render, 1000);


		ctx.fillStyle = "#ddd";
		ctx.fillRect(0, 0, sw, sh);

		for (var i = 0; i < 100; i++) insertItemAnywhere();

		ctx.fillStyle = "#bbb";
		for (var y = 0; y < hei; y++) {
			for (var x = 0; x < wid; x++) {
				ctx.fillRect(x * block - 2 + block / 2, y * block - 2 + block / 2, 4, 4);
			}
		}

		ctx.beginPath();
		var item = first;
		while(item) {
			var x = item.x * block + block / 2,
				y = item.y * block + block / 2;
			if (item == first) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
			// console.log(item);
			item = item.next;
		}
		ctx.stroke();
	}

	return {
		stage: bmp.canvas,
		init: init
	}

};

define("linked_line", linked_line);