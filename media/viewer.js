
(function () {
	const vscode = acquireVsCodeApi();
	const imageElement = document.getElementById("image");
	let zoom = 1;
	const ZOOM_SPEED = 0.1;

	imageElement.addEventListener("wheel", (event) => {
		if (event.deltaY > 0) {
			if (zoom < 0) {
				zoom = 0;
			}
			if (zoom < 1) {
				zoom -= ZOOM_SPEED * zoom;
			} else {
				zoom -= ZOOM_SPEED;
			}
		} else {
			if (zoom < 1) {
				zoom += ZOOM_SPEED / 3;
			} else {
				zoom += ZOOM_SPEED;
			}
		}
		imageElement.style.transform = `scale(${zoom})`;
	});

	var xCursorDiff = 0,
		yCursorDiff = 0,
		xImgElement = 0,
		yImgElement = 0,
		dragging = null,
		currentCursorPosition = [0, 0],
		lastCursorPosition = [0, 0];

	imageElement.addEventListener('mousedown', (event) => {
		dragging = true;
		console.log(event);
		// xImgElement = window.event.clientX - document.getElementById('image').offsetLeft;
		xImgElement = imageElement.offsetLeft;
		// yImgElement = window.event.clientY - document.getElementById('image').offsetTop;
		yImgElement = imageElement.offsetTop;
		currentCursorPosition = [window.event.clientX, window.event.clientY];
		// if (currentCursorPosition[0] === 0 && currentCursorPosition[1] === 0) {
		// 	currentCursorPosition = [window.event.clientX, window.event.clientY];
		// } else {
		// 	currentCursorPosition = [xCursorDiff, yCursorDiff];
		// }
		console.log(currentCursorPosition, xCursorDiff, yCursorDiff);
		console.log(window.event.clientX, window.event.clientY, xImgElement, yImgElement);
		// console.log(document.getElementById('container'));
	});

	imageElement.addEventListener('mousemove', (event) => {
		if (dragging === true) {
			let xCursor = window.event.clientX;
			let yCursor = window.event.clientY;
			if (xCursorDiff !== 0 && yCursorDiff !== 0) {
				xCursorDiff = currentCursorPosition[0] - xCursor + xCursorDiff;
				yCursorDiff = currentCursorPosition[1] - yCursor + yCursorDiff;
			} else {
				xCursorDiff = currentCursorPosition[0] - xCursor;
				yCursorDiff = currentCursorPosition[1] - yCursor;
			}

			if (imageElement !== null) {
				imageElement.style.transform = `scale(${zoom}) translate(${-xCursorDiff}px, ${-yCursorDiff}px)`;
				// imageElement.style.left = `scale(${zoom}) ${xImgElement}px`;
				// imageElement.style.top = `scale(${zoom}) ${yImgElement}px`;
				console.log(imageElement.style.transform, currentCursorPosition, xCursor, yCursor, xCursorDiff, yCursorDiff);
			}
		}
	});

	imageElement.addEventListener('mouseup', (event) => {
		dragging = false;
		// lastCursorPosition = [xCursorDiff, yCursorDiff];
		// currentCursorPosition = [xCursorDiff, yCursorDiff];
		// console.log(currentCursorPosition);
	});

	// var img_ele = null,
	// 	x_cursor = 0,
	// 	y_cursor = 0,
	// 	x_img_ele = 0,
	// 	y_img_ele = 0;

	// function start_drag() {
	// 	img_ele = this;
	// 	x_img_ele = window.event.clientX - document.getElementById('image').offsetLeft;
	// 	y_img_ele = window.event.clientY - document.getElementById('image').offsetTop;

	// }

	// function stop_drag() {
	// 	img_ele = null;
	// }

	// function while_drag() {
	// 	var x_cursor = window.event.clientX;
	// 	var y_cursor = window.event.clientY;
	// 	if (img_ele !== null) {
	// 		img_ele.style.left = (x_cursor - x_img_ele) + 'px';
	// 		img_ele.style.top = (window.event.clientY - y_img_ele) + 'px';

	// 		console.log(img_ele.style.left + ' - ' + img_ele.style.top);

	// 	}
	// }

	// document.getElementById('image').addEventListener('mousedown', start_drag);
	// document.getElementById('container').addEventListener('mousemove', while_drag);
	// document.getElementById('container').addEventListener('mouseup', stop_drag);
}());;