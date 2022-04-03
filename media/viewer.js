
(function () {
	const vscode = acquireVsCodeApi();
	const zoomElement = document.querySelector(".zoom");
	let zoom = 1;
	const ZOOM_SPEED = 0.1;

	document.addEventListener("wheel", function (event) {
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
		console.log(zoom);
		zoomElement.style.transform = `scale(${zoom})`;
	});
}());