(function () {
	const container = document.getElementById('container');

	panzoom(container, {
		minZoom: 0.6,
	});

	window.addEventListener('message', event => {
		const message = event.data;

		switch (message.command) {
			case 'vscodeImageGalleryViewer.changeImage':
				let timestamp = new Date().getTime();
				let changeImage = document.getElementById("image");
				changeImage.setAttribute("src", message.imgSrc + "?t=" + timestamp);
				changeImage.setAttribute("data-src", message.imgSrc + "?t=" + timestamp);
				break;
		}
	}, true);
}());
