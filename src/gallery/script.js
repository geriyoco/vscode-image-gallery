const vscode = acquireVsCodeApi();
let gFolders = {}; // a global holder for all content DOMs to preserve attributes
/** {folderId: {
		status: "",
		bar: domBarButton,
		grid: domGridDiv,
		images: {
			imageId: {
				status: "" | "refresh",
				container: domContainerDiv,
			}, ...
		},
	}, ...}
 **/

function init() {
	initMessageListeners();
	DOMManager.requestContentDOMs();
	EventListener.addAllToToolbar();
}

function initMessageListeners() {
	window.addEventListener("message", event => {
		const message = event.data;
		const command = message.command;
		delete message.command;
		switch (command) {
			case "POST.gallery.responseContentDOMs":
				DOMManager.updateGlobalDoms(message);
				DOMManager.updateGalleryContent();
				break;
			case "POST.gallery.setColumnCount":
				updateColumnCount(message.columnCount);
				break;
		}
	});
}

const imageObserver = new IntersectionObserver(
	(entries, _observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const image = entry.target;
				imageObserver.unobserve(image);
				image.src = image.dataset.src;
				image.onload = () => image.classList.replace("unloaded", "loaded");
			}
		});
	}
);

class DOMManager {
	static htmlToDOM(html) {
		const template = document.createElement("template");
		template.innerHTML = html.trim();
		return template.content.firstChild;
	}

	static requestContentDOMs() {
		vscode.postMessage({
			command: "POST.gallery.requestContentDOMs",
		});
	}

	static updateGlobalDoms(response) {
		const content = JSON.parse(response.content);

		// remove deleted images and folders
		for (const folderId of Object.keys(gFolders)) {
			for (const imageId of Object.keys(gFolders[folderId].images)) {
				if (content.hasOwnProperty(folderId) && !content[folderId].images.hasOwnProperty(imageId)) {
					gFolders[folderId].images[imageId].container.remove();
					delete gFolders[folderId].images[imageId];
				}
			}

			if (!content.hasOwnProperty(folderId)) {
				gFolders[folderId].bar.remove();
				gFolders[folderId].grid.remove();
				delete gFolders[folderId];
			}
		}

		// synchronize the images and folders
		// convert all new html to DOMs
		for (const [folderId, folder] of Object.entries(content)) {
			if (gFolders.hasOwnProperty(folderId)) { // old folder
				content[folderId].bar = gFolders[folderId].bar;
				content[folderId].grid = gFolders[folderId].grid;
			}
			else { // new folder
				content[folderId].bar = DOMManager.htmlToDOM(folder.barHtml);
				content[folderId].grid = DOMManager.htmlToDOM(folder.gridHtml);
				delete content[folderId].barHtml;
				delete content[folderId].gridHtml;
				EventListener.addToFolderBar(content[folderId].bar);
			}

			for (const [imageId, image] of Object.entries(folder.images)) {
				const hasFolder = gFolders.hasOwnProperty(folderId);
				const hasImage = hasFolder && gFolders[folderId].images.hasOwnProperty(imageId);

				if (hasFolder && hasImage && image.status !== "refresh") { // old image
					content[folderId].images[imageId].container = gFolders[folderId].images[imageId].container;
				} 
				else if (hasFolder && hasImage && image.status === "refresh") { // image demands refresh
					gFolders[folderId].images[imageId].container.remove();
					content[folderId].images[imageId].container = DOMManager.htmlToDOM(image.containerHtml);
					delete content[folderId].images[imageId].containerHtml;
					EventListener.addToImageContainer(content[folderId].images[imageId].container);

					const imageDom = content[folderId].images[imageId].container.querySelector("#" + imageId);
					imageDom.src += "?t=" + Date.now();
					imageDom.dataset.src += "?t=" + Date.now();
				}
				else { // new image
					content[folderId].images[imageId].container = DOMManager.htmlToDOM(image.containerHtml);
					delete content[folderId].images[imageId].containerHtml;
					EventListener.addToImageContainer(content[folderId].images[imageId].container);
				}
				content[folderId].images[imageId].status = "";

			}

			// update counts
			const countText = (object, count) => `${count} ${object}${count === 1 ? "" : "s"} found`;
			const nImages = Object.keys(content[folderId].images).length;
			content[folderId].bar.querySelector(`#${folderId}-items-count`).textContent = countText("image", nImages);
			const nFolders = Object.keys(content).length;
			document.querySelector('.toolbar .folder-count').textContent = countText("folder", nFolders);
		}

		gFolders = content;
	}

	static updateGalleryContent() {
		const content = document.querySelector(".gallery-content");
		content.replaceChildren(
			...Object.values(gFolders).flatMap(folder => {
				folder.grid.replaceChildren(
					...Object.values(folder.images).map(image => image.container)
				);
				return [folder.bar, folder.grid];
			})
		);
		if (content.childElementCount === 0) {
			content.innerHTML = "<p>No image found in this folder.</p>";
		}
	}
}

class EventListener {
	static addAllToToolbar() {
		document.querySelector(".toolbar .collapse-all").addEventListener(
			"click", () => EventListener.collapseAllFolderBars()
		);
		document.querySelector(".toolbar .expand-all").addEventListener(
			"click", () => EventListener.expandAllFolderBars()
		);
		document.querySelector(".toolbar .dropdown").addEventListener(
			"change", () => EventListener.sortRequest()
		);
		document.querySelector(".toolbar .sort-order-arrow").addEventListener(
			"click", () => {
				EventListener.toggleSortOrder();
				EventListener.sortRequest();
			}
		);
	}

	static addToFolderBar(folderBar) {
		folderBar.addEventListener("click", () => {
			EventListener.toggleFolderBar(folderBar);
		});
	}

	static addToImageContainer(imageContainer) {
		for (const child of imageContainer.childNodes) {
			if (child.nodeName !== "IMG") { continue; }
			const image = child;

			imageContainer.addEventListener("click", () => {
				EventListener.openImageViewer(image.dataset.path, true);
			});
			imageContainer.addEventListener("dblclick", () => {
				EventListener.openImageViewer(image.dataset.path, false);
			});
			imageContainer.addEventListener("mouseover", () => {
				const tooltip = image.previousElementSibling;
				if (!tooltip.classList.contains("tooltip")) {
					throw new Error("DOM element is not of class tooltip");
				}
				EventListener.showImageMetadata(tooltip, image.dataset.meta);
			});
			imageContainer.addEventListener("mouseout", () => {
				image.previousElementSibling.textContent = "";
			});

			if (image.classList.contains("unloaded")) {
				imageObserver.observe(image);
			}
		}
	}

	static openImageViewer(path, preview) {
		vscode.postMessage({
			command: "POST.gallery.openImageViewer",
			path: path,
			preview: preview,
		});
	}

	static showImageMetadata(tooltipDOM, metadata) {
		const image = tooltipDOM.nextElementSibling;

		const data = JSON.parse(metadata);

		const pow = Math.floor(Math.log(data.size) / Math.log(1024));
		const unit = ["bytes", "kB", "MB", "GB", "TB", "PB"][pow];
		const sizeStr = (data.size / Math.pow(1024, pow)).toFixed(2) + " " + unit;

		const dateOptions = {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		};
		const ctimeStr = new Date(data.ctime).toLocaleString("en-US", dateOptions);
		const mtimeStr = new Date(data.mtime).toLocaleString("en-US", dateOptions);

		tooltipDOM.textContent = [
			`Dimensions: ${image.naturalWidth} x ${image.naturalHeight}`,
			`Type: ${data.ext}`,
			`Size: ${sizeStr}`,
			`Modified: ${mtimeStr}`,
			`Created: ${ctimeStr}`,
		].join("\n");
	}

	static getFolderAssociatedElements(folderDOM) {
		return {
			arrow: document.getElementById(`${folderDOM.id}-arrow`),
			arrowImg: document.getElementById(`${folderDOM.id}-arrow-img`),
			grid: document.getElementById(`${folderDOM.id}-grid`),
		};
	}

	static toggleFolderBar(folderDOM) {
		switch (folderDOM.dataset.state) {
			case "collapsed":
				EventListener.expandFolderBar(folderDOM);
				break;
			case "expanded":
				EventListener.collapseFolderBar(folderDOM);
				break;
		}
	}

	static expandFolderBar(folderDOM) {
		const elements = EventListener.getFolderAssociatedElements(folderDOM);
		if (elements.arrowImg.src.includes("chevron-right.svg")) {
			elements.arrowImg.src = elements.arrowImg.dataset.chevronDown;
		}
		elements.grid.style.display = "grid";
		folderDOM.dataset.state = "expanded";
	}

	static collapseFolderBar(folderDOM) {
		const elements = EventListener.getFolderAssociatedElements(folderDOM);
		if (elements.arrowImg.src.includes("chevron-down.svg")) {
			elements.arrowImg.src = elements.arrowImg.dataset.chevronRight;
		}
		elements.grid.style.display = "none";
		folderDOM.dataset.state = "collapsed";
	}

	static expandAllFolderBars() {
		const folders = document.querySelectorAll(".folder");
		folders.forEach(folder => EventListener.expandFolderBar(folder));
	}

	static collapseAllFolderBars() {
		const folders = document.querySelectorAll(".folder");
		folders.forEach(folder => EventListener.collapseFolderBar(folder));
	}

	static toggleSortOrder() {
		const sortArrowImg = document.querySelector(".toolbar .sort-order-arrow-img");
		if (sortArrowImg.src.includes("arrow-up.svg")) {
			sortArrowImg.src = sortArrowImg.dataset.arrowDown;
			return;
		}
		if (sortArrowImg.src.includes("arrow-down.svg")) {
			sortArrowImg.src = sortArrowImg.dataset.arrowUp;
			return;
		}
	}

	static sortRequest() {
		const dropdownDOM = document.querySelector(".toolbar .dropdown");
		const sortOrderDOM = document.querySelector(".toolbar .sort-order-arrow-img");
		vscode.postMessage({
			command: "POST.gallery.requestSort",
			valueName: dropdownDOM.value,
			ascending: sortOrderDOM.src.includes("arrow-up.svg") ? true : false,
		});
	}
}

// Column control functionality
const columnInput = document.getElementById('column-count');
const columnArrows = document.querySelectorAll('.column-arrow');
const autoCheckbox = document.getElementById('auto-columns');

function updateColumnCount(count) {
	const grids = document.querySelectorAll('.grid');
	grids.forEach(grid => {
		if (autoCheckbox.checked) {
			grid.style.removeProperty('--column-count');
			grid.style.removeProperty('--column-width');
		} else {
			grid.style.setProperty('--column-count', count);
			grid.style.setProperty('--column-width', '1fr');
		}
	});
}

// Update column input and arrows state based on auto checkbox
function updateColumnControlState() {
	const isAuto = autoCheckbox.checked;
	columnInput.disabled = isAuto;
	columnArrows.forEach(arrow => arrow.disabled = isAuto);
	updateColumnCount(isAuto ? null : columnInput.value);
}

columnInput.addEventListener('change', (e) => {
	if (autoCheckbox.checked) {return;}
	const value = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 100);
	e.target.value = value;
	vscode.postMessage({
		command: 'POST.gallery.updateColumnCount',
		columnCount: value
	});
	updateColumnCount(value);
});

columnArrows.forEach(arrow => {
	arrow.addEventListener('click', () => {
		if (autoCheckbox.checked) {return;}
		const currentValue = parseInt(columnInput.value) || 1;
		const direction = arrow.dataset.direction;
		const newValue = direction === 'up' 
			? Math.min(currentValue + 1, 100)
			: Math.max(currentValue - 1, 1);
		
		columnInput.value = newValue;
		vscode.postMessage({
			command: 'POST.gallery.updateColumnCount',
			columnCount: newValue
		});
		updateColumnCount(newValue);
	});
});

autoCheckbox.addEventListener('change', () => {
	updateColumnControlState();
	vscode.postMessage({
		command: 'POST.gallery.updateColumnCount',
		columnCount: autoCheckbox.checked ? null : columnInput.value
	});
});

// Initialize column control state
updateColumnControlState();

(function () {
	init();
}());
