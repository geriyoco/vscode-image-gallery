
(function () {
	const vscode = acquireVsCodeApi();

	let grid = document.getElementsByClassName("grid")[0];
	let lazyloadImages = document.querySelectorAll(".lazy");
	let imageObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				var image = entry.target;
				imageObserver.unobserve(image);
				image.src = image.dataset.src;
				image.onload = () => {
					image.classList.remove("lazy");
					image.classList.add("loaded");
				};
				if (lazyloadImages[lazyloadImages.length - 1].src === image.src) {
					imageObserver.disconnect();
				}
			}
		});
	});

	lazyloadImages.forEach((image) => {
		imageObserver.observe(image);
	});

	document.addEventListener('click', event => {
		let node = event && event.target;
		if (!node.classList.contains('image')) { return; }

		vscode.postMessage({
			command: 'vscodeImageGallery.openViewer',
			src: node.src,
		});
	}, true);

	window.addEventListener('message', event => {
		const message = event.data;

		switch (message.command) {
			case 'vscodeImageGallery.addImage':
				let imgNode = document.createElement("img");
				imgNode.setAttribute("class", "image loaded");
				imgNode.setAttribute("id", message.imgPath);
				imgNode.setAttribute("src", message.imgSrc);
				imgNode.setAttribute("data-src", message.imgSrc);

				let divNode = document.createElement("div");
				divNode.setAttribute("class", "filename");
				divNode.setAttribute("id", message.imgPath + "-filename");
				divNode.textContent = message.imgPath.split("/").pop();

				let containerNode = document.createElement("div");
				containerNode.setAttribute("class", "image-container");
				containerNode.appendChild(imgNode);
				containerNode.appendChild(divNode);
				grid.appendChild(containerNode);
				break;
			case 'vscodeImageGallery.changeImage':
				let timestamp = new Date().getTime();
				let changeImage = document.getElementById(message.imgPath);
				changeImage.setAttribute("src", message.imgSrc + "?t=" + timestamp);
				changeImage.setAttribute("data-src", message.imgSrc + "?t=" + timestamp);

				let changeFilename = document.getElementById(message.imgPath + "-filename");
				changeFilename.setAttribute("class", "filename");
				changeFilename.setAttribute("id", message.imgPath + "-filename");
				changeFilename.textContent = message.imgPath.split("/").pop();
				break;
			case 'vscodeImageGallery.deleteImage':
				let deleteImage = document.getElementById(message.imgPath);
				deleteImage.parentElement.remove();
				break;
		}
	}, true);
}());