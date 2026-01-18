(function () {
	const container = document.getElementById('container');

	panzoom(container, {
		minZoom: 0.6,
	});
}());

const image = document.getElementById('image');
window.addEventListener('message', (event) => {
	const message = event.data;
	if (message && message.type === 'refreshImage' && image) {
		const src = image.src.split('?')[0];
		image.src = src + '?t=' + Date.now();
		console.log('Image refreshed since updated externally:', src);
	}
});
