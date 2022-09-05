const vscode = acquireVsCodeApi();
let gFolders = {}; // a global holder for all content DOMs to preserve attributes
/** {folderId: {
 * 		bar: domObject,
 *		grid: domObject,
 *		images: { imageId: domObject, ... },
 *	}, ... }
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
				image.onload = () => {
					image.classList.remove("unloaded");
					image.classList.add("loaded");
				};
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
			if (!content.hasOwnProperty(folderId)) {
				gFolders[folderId].bar.remove();
				gFolders[folderId].grid.remove();
				delete gFolders[folderId];
				continue;
			}

			for (const imageId of Object.keys(gFolders[folderId].images)) {
				if (!content[folderId].images.hasOwnProperty(imageId)) {
					gFolders[folderId].images[imageId].remove();
					delete gFolders[folderId].images[imageId];
				}
			}
		}

		// synchronize the images and folders
		// convert all new html to DOMs
		for (const [folderId, folder] of Object.entries(content)) {
			if (gFolders.hasOwnProperty(folderId)) {
				content[folderId].bar = gFolders[folderId].bar;
				content[folderId].grid = gFolders[folderId].grid;
			} else {
				content[folderId].bar = DOMManager.htmlToDOM(folder.barHtml);
				content[folderId].grid = DOMManager.htmlToDOM(folder.gridHtml);
				delete content[folderId].barHtml;
				delete content[folderId].gridHtml;
				EventListener.addToFolderBar(content[folderId].bar);
			}

			for (const [imageId, imageHtml] of Object.entries(folder.images)) {
				if (gFolders.hasOwnProperty(folderId) && gFolders[folderId].images.hasOwnProperty(imageId)) {
					content[folderId].images[imageId] = gFolders[folderId].images[imageId];
				} else {
					content[folderId].images[imageId] = DOMManager.htmlToDOM(imageHtml);
					delete content[folderId].images[imageId].imageHtml;
					EventListener.addToImageContainer(content[folderId].images[imageId]);
				}
			}
		}
		gFolders = content;
	}

	static updateGalleryContent() {
		const content = document.querySelector(".gallery-content");
		content.innerHTML = "";
		for (const folder of Object.values(gFolders)) {
			content.appendChild(folder.bar);
			content.appendChild(folder.grid);
			for (const imageDom of Object.values(folder.images)) {
				folder.grid.appendChild(imageDom);
			}
		}
		if (content.innerHTML === "") {
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
		if (elements.arrow.classList.contains("codicon-chevron-right")) {
			elements.arrow.classList.remove("codicon-chevron-right");
			elements.arrow.classList.add("codicon-chevron-down");
		}
		elements.grid.style.display = "grid";
		folderDOM.dataset.state = "expanded";
	}

	static collapseFolderBar(folderDOM) {
		const elements = EventListener.getFolderAssociatedElements(folderDOM);
		if (elements.arrow.classList.contains("codicon-chevron-down")) {
			elements.arrow.classList.remove("codicon-chevron-down");
			elements.arrow.classList.add("codicon-chevron-right");
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
		const dom = document.querySelector(".toolbar .sort-order-arrow");
		if (dom.classList.contains("codicon-arrow-up")) {
			dom.setAttribute("class", "sort-order-arrow codicon codicon-arrow-down");
		} else if (dom.classList.contains("codicon-arrow-down")) {
			dom.setAttribute("class", "sort-order-arrow codicon codicon-arrow-up");
		}
	}

	static sortRequest() {
		const dropdownDOM = document.querySelector(".toolbar .dropdown");
		const sortOrderDOM = document.querySelector(".toolbar .sort-order-arrow");
		vscode.postMessage({
			command: "POST.gallery.requestSort",
			valueName: dropdownDOM.value,
			ascending: sortOrderDOM.classList.contains("codicon-arrow-up") ? true : false,
		});
	}
}

(function () {
	init();
}());
