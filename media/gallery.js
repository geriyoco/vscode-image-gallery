
(function () {
	const vscode = acquireVsCodeApi();
	// const observer = window.lozad();
	// observer.observe();

	window.addEventListener('scroll', () => {
		const {
			scrollTop,
			scrollHeight,
			clientHeight
		} = document.documentElement;
		console.log(scrollHeight, scrollTop, clientHeight);

		if (scrollTop + clientHeight >= scrollHeight - 5) {
			console.log("help");
			// vscode.postMessage({
			// 	command: 'alert',
			// 	text: '🐛  on line ' + currentCount
			// });
		}
	}, {
		passive: true
	});

	document.addEventListener('click', event => {
		let node = event && event.target;
		if (!node.classList.contains('image')) { return; }

		vscode.postMessage({
			command: 'vscode-image-gallery.openImageViewer',
			src: node.src,
		});
		console.log('User clicked on: ' + node.src);
	}, true);
}());