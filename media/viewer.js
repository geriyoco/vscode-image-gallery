(function () {
	const container = document.getElementById('container');

	panzoom(container, {
		minZoom: 0.4,
		bounds: true,
		boundsPadding: 0.1,
		transformOrigin: { x: 0.5, y: 0.5 }
	});
}());
