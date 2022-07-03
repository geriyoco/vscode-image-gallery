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

		if (!node.classList.contains('image')) { return; }

		vscode.postMessage({
			command: 'vscodeImageGallery.openViewer',
			src: node.src,
			preview: preview,
		});
	};
	document.addEventListener('click', event => clickHandler(event, preview = true), { passive: true });
	document.addEventListener('dblclick', event => clickHandler(event, preview = false), { passive: true });

	document.addEventListener('mouseover', event => {
		const node = event && event.target;
		if (!node.classList.contains('image')) { return; }
		let imgMetadata = JSON.parse(node.getAttribute('data-meta'));
		let lastIndex = node.src.lastIndexOf('.');
		let imgExtension = node.src.slice(lastIndex + 1, );
		let created = new Date(imgMetadata.ctime).toISOString();
		let modified = new Date(imgMetadata.mtime).toISOString();
		let i = Math.floor(Math.log(imgMetadata.size) / Math.log(1024));
		let imgSize = (imgMetadata.size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
		
		node.previousElementSibling.textContent = `Dimensions: ${node.naturalHeight} x ${node.naturalWidth}\nImage Type: ${imgExtension}\nSize: ${imgSize}\nCreated: ${created }\nModified: ${modified }`;
		return;
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

				let folderItemsCountOnAdd = document.getElementById(`${Object.keys(message.pathsBySubFolders)[0]}-items-count`);
				folderItemsCountOnAdd.textContent = folderItemsCountOnAdd.textContent.replace(/\d+/g, (match, _) => parseInt(match) + 1);
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

				let folderItemsCountOnDel = document.getElementById(`${Object.keys(message.pathsBySubFolders)[0]}-items-count`);
				folderItemsCountOnDel.textContent = folderItemsCountOnDel.textContent.replace(/\d+/g, (match, _) => parseInt(match) - 1);
				break;
		}
	}, true);
}());