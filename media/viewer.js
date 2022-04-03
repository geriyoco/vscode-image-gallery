(function () {
	// Zoom in/out with mouse wheel & Panning with mouse
	// Reference: https://dev.to/stackfindover/zoom-image-point-with-mouse-wheel-11n3

	const container = document.getElementById('container');

	let scale = 1;
	let scrollRate = 1.1;
	let isPanning = false;
	let initialPoint = {x: 0, y: 0};
	let point = {x: 0, y: 0};

	function setTransform(translater, scalar) {
		container.style.transform = `
			translate(${translater.x}px, ${translater.y}px)
			scale(${scalar})
		`;
	}

	container.addEventListener("wheel", (event) => {
		event.preventDefault();
		let pointScale = {
			x: (event.clientX - point.x) / scale,
			y: (event.clientY - point.y) / scale
		};
		let delta = (event.wheelDelta ? event.wheelDelta : -event.deltaY);
		(delta > 0) ? scale *= scrollRate : scale /= scrollRate;
		point = {
			x: event.clientX - pointScale.x * scale,
			y: event.clientY - pointScale.y * scale
		};
		setTransform(point, scale);
	});

	container.addEventListener("mousedown", (event) => {
		event.preventDefault();
		isPanning = true;
		initialPoint = {
			x: event.clientX - point.x,
			y: event.clientY - point.y
		};
	});

	container.addEventListener("mousemove", (event) => {
		event.preventDefault();
		if (!isPanning) { return; }
		point = {
			x: event.clientX - initialPoint.x,
			y: event.clientY - initialPoint.y
		};
		setTransform(point, scale);
	});

	container.addEventListener("mouseup", (event) => {
		event.preventDefault();
		isPanning = false;
	});
}());
