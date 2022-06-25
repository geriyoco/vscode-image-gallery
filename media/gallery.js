
(function () {
	const vscode = acquireVsCodeApi();

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
			}
		});
	});

	lazyloadImages.forEach((image) => {
		imageObserver.observe(image);
	});

	// click events
	const clickHandler = (event, preview) => {
		const node = event && event.target;
		const folderHeader = ['folder','folder-title','folder-arrow'];
		if (folderHeader.some(el => node.classList.contains(el))) {
			console.log(node);
			let id = '';
			if (node.classList.contains('folder')) {
				id = node.id;
			} else {
				let lastIndexToSplit = node.id.lastIndexOf('-');
				id = node.id.slice(0, lastIndexToSplit);

			}

			let folderGrid = document.getElementById(id + '-grid');
			let folderArrow = document.getElementById(id + '-arrow');
			folderGrid.style.display = folderGrid.style.display === "none" ? "" : "none";
			folderArrow.textContent = folderArrow.textContent === "⮟" ? "⮞" : "⮟";
		}
		if (!node.classList.contains('image')) { return; }

		vscode.postMessage({
			command: 'POST.click',
			src: node.src,
			preview: preview,
		});
	};
	document.addEventListener('click', event => clickHandler(event, preview=true), true);
	document.addEventListener('dblclick', event => clickHandler(event, preview=false), true);

	// hover events
	document.addEventListener('mouseover', event => {
		const node = event && event.target;
		if (!node.classList.contains('image')) { return; }
		vscode.postMessage({
			command: 'POST.hover',
			src: node.src,
		});
	});

	window.addEventListener('message', event => {
		const message = event.data;

		switch (message.command) {
			case 'vscodeImageGallery.addImage':
				let addedTimestamp = new Date().getTime();
				let imgNode = document.createElement("img");
				imgNode.setAttribute("class", "image loaded");
				imgNode.setAttribute("id", message.imgPath);
				imgNode.setAttribute("src", `${message.imgSrc}?t=${addedTimestamp}`);
				imgNode.setAttribute("data-src", `${message.imgSrc}?t=${addedTimestamp}`);

				let divNode = document.createElement("div");
				divNode.setAttribute("class", "filename");
				divNode.setAttribute("id", message.imgPath + "-filename");
				divNode.textContent = message.imgPath.split("/").pop();

				let containerNode = document.createElement("div");
				containerNode.setAttribute("class", "image-container");
				containerNode.appendChild(imgNode);
				containerNode.appendChild(divNode);

				let grid = document.getElementById(`${Object.keys(message.pathsBySubFolders)[0]}-grid`);
				grid.appendChild(containerNode);
				break;
			case 'vscodeImageGallery.changeImage':
				let changedTimestamp = new Date().getTime();
				let changeImage = document.getElementById(message.imgPath);
				changeImage.setAttribute("src", `${message.imgSrc}?t=${changedTimestamp}`);
				changeImage.setAttribute("data-src", `${message.imgSrc}?t=${changedTimestamp}`);

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