
(function () {
	const vscode = acquireVsCodeApi();

	// Page is loaded
	lazyloadImages = document.querySelectorAll(".lazy");
	var imageObserver = new IntersectionObserver(function (entries, observer) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				var image = entry.target;
				imageObserver.unobserve(image);
				image.src = image.dataset.src;
				image.onload = () => {
					image.classList.remove("lazy");
					image.classList.add("loaded");
				};
			}
		});
	});

	lazyloadImages.forEach(function (image) {
		imageObserver.observe(image);
	});

	document.addEventListener('click', event => {
		let node = event && event.target;
		if (!node.classList.contains('image')) { return; }

		vscode.postMessage({
			command: 'vscodeImageGallery.openViewer',
			src: node.src,
		});
		console.log('User clicked on: ' + node.src);
	}, true);
}());