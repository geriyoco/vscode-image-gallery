(function () {
	const vscode = acquireVsCodeApi();

	let gridElements = document.querySelectorAll(".grid");
	gridElements.forEach((gridElement) => {
		if (!gridElement.className.includes("grid-0")) {
			gridElement.style.display = "none";
			gridElement.previousElementSibling.firstElementChild.textContent = "⮞";
		}
	});

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

	const clickHandler = (event, preview) => {
		let node = event && event.target;
		const folderHeader = ['folder', 'folder-title', 'folder-arrow'];
		if (folderHeader.some(el => node.classList.contains(el))) {
			let id = '';
			if (node.classList.contains('folder')) {
				id = node.id;
			} else {
				let lastIndexToSplit = node.id.lastIndexOf('-');
				id = node.id.slice(0, lastIndexToSplit);
			}

			let folderGrid = document.getElementById(id + '-grid');
			let folderArrow = document.getElementById(id + '-arrow');
			folderGrid.style.display = folderGrid.style.display === "none" ? "grid" : "none";
			folderArrow.textContent = folderArrow.textContent === "⮟" ? "⮞" : "⮟";

			let expandAll = Array.from(gridElements).some(el => el.style.display === "none");
			if (expandAll) {
				let collapseAllButton = document.getElementsByClassName("codicon-collapse-all");
				if (collapseAllButton.length !== 0) {
					collapseAllButton[0].setAttribute("class", "codicon codicon-expand-all");
				}
			} else {
				let expandAllButton = document.getElementsByClassName("codicon-expand-all");
				if (expandAllButton.length !== 0) {
					expandAllButton[0].setAttribute("class", "codicon codicon-collapse-all");
				}
			}
			return;
		}

		if (node.classList.contains("codicon-expand-all")) {
			gridElements.forEach((gridElement) => {
				gridElement.style.display = "grid";
				gridElement.previousElementSibling.firstElementChild.textContent = "⮟";
			});
			node.setAttribute("class", "codicon codicon-collapse-all");
			return;
		}
		if (node.classList.contains("codicon-collapse-all")) {
			gridElements.forEach((gridElement) => {
				gridElement.style.display = "none";
				gridElement.previousElementSibling.firstElementChild.textContent = "⮞";
			});
			node.setAttribute("class", "codicon codicon-expand-all");
			return;
		}

		if (!node.parentElement.classList.contains('image-container')) { return; }

		if (node.parentElement.classList.contains('image-container')) {
			node.parentElement.childNodes.forEach((childNode) => {
				if (childNode.nodeName.toLowerCase() === 'img') {
					vscode.postMessage({
						command: 'vscodeImageGallery.openViewer',
						src: childNode.src,
						preview: preview,
					});
				}
			});
			return;
		}
		return;
	};
	document.addEventListener('click', event => clickHandler(event, preview = true), { passive: true });
	document.addEventListener('dblclick', event => clickHandler(event, preview = false), { passive: true });

	document.addEventListener('mouseover', event => {
		const node = event && event.target;
		if (!node.classList.contains('image')) { return; }

		const lastDotIndex = node.src.lastIndexOf('.');
		const imgExtension = node.src.slice(lastDotIndex + 1, ).toUpperCase();
		const dateOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		};

		const imgMetadata = JSON.parse(node.getAttribute('data-meta'));
		const createdDate = new Date(imgMetadata.ctime).toLocaleDateString('en-US', dateOptions);
		const modifiedDate = new Date(imgMetadata.mtime).toLocaleTimeString('en-US', dateOptions);
		let i = Math.floor(Math.log(imgMetadata.size) / Math.log(1024));
		let imgSize = (imgMetadata.size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['bytes', 'KB', 'MB', 'GB', 'TB'][i];
		
		node.previousElementSibling.textContent = (
		`Dimensions: ${node.naturalHeight} x ${node.naturalWidth}
		Type: ${imgExtension}
		Size: ${imgSize}
		Created: ${createdDate}
		Modified: ${modifiedDate}`
		).replace(/^		+/gm, '');
		return;
	});

	const sortOrder = document.getElementsByClassName('sort-order')[0];
	const sortMode = document.getElementById('dropdown-sort');
	sortOrder.addEventListener('click', event => {
		vscode.postMessage({
			command: 'vscodeImageGallery.sortImages',
			mode: sortMode.value,
			ascending: sortOrder.classList.contains('codicon-arrow-down'), // to flip current sort order
		});
	});
	sortMode.addEventListener('change', event => {
		vscode.postMessage({
			command: 'vscodeImageGallery.sortImages',
			mode: sortMode.value,
			ascending: sortOrder.classList.contains('codicon-arrow-up'), // to preserve current sort order
		});
	});

	window.addEventListener('message', event => {
		const message = event.data;

		switch (message.command) {
			case 'vscodeImageGallery.addImage':
				let addedTimestamp = new Date().getTime();
				let folder = Object.keys(message.imagesBySubFolders)[0];
				let imgNode = document.createElement("img");
				imgNode.setAttribute("class", "image loaded");
				imgNode.setAttribute("id", message.imgPath);
				imgNode.setAttribute("src", `${message.imgSrc}?t=${addedTimestamp}`);
				imgNode.setAttribute("data-src", `${message.imgSrc}?t=${addedTimestamp}`);
				imgNode.setAttribute("data-meta", `${JSON.stringify(message.imagesBySubFolders[folder][0].imgMetadata)}`);

				let divNode = document.createElement("div");
				divNode.setAttribute("class", "filename");
				divNode.setAttribute("id", message.imgPath + "-filename");
				divNode.textContent = message.imgPath.split("/").pop();

				let tooltipNode = document.createElement("span");
				tooltipNode.setAttribute("class", "tooltiptext");
				tooltipNode.setAttribute("id", message.imgPath + "-tooltip");

				let containerNode = document.createElement("div");
				containerNode.setAttribute("class", "image-container tooltip");
				containerNode.appendChild(tooltipNode);
				containerNode.appendChild(imgNode);
				containerNode.appendChild(divNode);
				
				let grid = document.getElementById(`${folder}-grid`);
				grid.appendChild(containerNode);

				let folderItemsCountOnAdd = document.getElementById(`${folder}-items-count`);
				folderItemsCountOnAdd.textContent = folderItemsCountOnAdd.textContent.replace(/\d+/g, (match, _) => parseInt(match) + 1);
				break;
			case 'vscodeImageGallery.changeImage':
				let changedTimestamp = new Date().getTime();
				let changeImage = document.getElementById(message.imgPath);
				changeImage.setAttribute("src", `${message.imgSrc}?t=${changedTimestamp}`);
				changeImage.setAttribute("data-src", `${message.imgSrc}?t=${changedTimestamp}`);
				changeImage.setAttribute("data-meta", `${JSON.stringify(message.imagesBySubFolders[folder][0].imgMetadata)}`);

				let changeFilename = document.getElementById(message.imgPath + "-filename");
				changeFilename.setAttribute("class", "filename");
				changeFilename.setAttribute("id", message.imgPath + "-filename");
				changeFilename.textContent = message.imgPath.split("/").pop();
				break;
			case 'vscodeImageGallery.deleteImage':
				let deleteImage = document.getElementById(message.imgPath);
				deleteImage.parentElement.remove();

				let folderItemsCountOnDel = document.getElementById(`${Object.keys(message.imagesBySubFolders)[0]}-items-count`);
				folderItemsCountOnDel.textContent = folderItemsCountOnDel.textContent.replace(/\d+/g, (match, _) => parseInt(match) - 1);
				break;
		}
	}, true);
}());