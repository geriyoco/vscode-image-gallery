import * as vscode from 'vscode';
import * as utils from './utils';
import { TImage, TFolder } from '.';

// global variables
let gFolders: Record<string, TFolder> = {};

export async function createPanel(context: vscode.ExtensionContext, galleryFolder?: vscode.Uri) {
	vscode.commands.executeCommand('setContext', 'ext.viewType', 'gryc.gallery');
	const panel = vscode.window.createWebviewPanel(
		'gryc.gallery',
		`Image Gallery${galleryFolder ? ': ' + utils.getFilename(galleryFolder.path) : ''}`,
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
		}
	);

	const htmlProvider = new HTMLProvider(context, panel.webview);
	const imageUris = await getImageUris(galleryFolder);
	gFolders = await utils.getFolders(imageUris);
	gFolders = new CustomSorter().sort(gFolders);
	panel.webview.html = htmlProvider.fullHTML(gFolders);
	return panel;
}

export function createFileWatcher(context: vscode.ExtensionContext, webview: vscode.Webview, galleryFolder?: vscode.Uri) {
	const globPattern = utils.getGlob();
	const watcher = vscode.workspace.createFileSystemWatcher(
		galleryFolder ?
			new vscode.RelativePattern(galleryFolder, globPattern) : globPattern
	);
	watcher.onDidCreate(async uri => {
		const folder = Object.values(await utils.getFolders([uri], "create"))[0];
		const image = Object.values(folder.images)[0];
		if (gFolders.hasOwnProperty(folder.id)) {
			if (!gFolders[folder.id].images.hasOwnProperty(image.id)) {
				gFolders[folder.id].images[image.id] = image;
			}
		} else {
			gFolders[folder.id] = folder;
		}
		messageListener({ command: "POST.gallery.requestSort" }, context, webview);
	});
	watcher.onDidDelete(async uri => {
		const folder = Object.values(await utils.getFolders([uri], "delete"))[0];
		const imageId = utils.hash256(webview.asWebviewUri(uri).path);
		if (gFolders.hasOwnProperty(folder.id)) {
			if (gFolders[folder.id].images.hasOwnProperty(imageId)) {
				delete gFolders[folder.id].images[imageId];
			}
			if (Object.keys(gFolders[folder.id].images).length === 0) {
				delete gFolders[folder.id];
			}
		}
		messageListener({ command: "POST.gallery.requestSort" }, context, webview);
	});
	watcher.onDidChange(async uri => {
		// rename is NOT handled here; it's handled automatically by Delete & Create
		// hence we can assume imageId and folderId to be the same
		const folder = Object.values(await utils.getFolders([uri], "change"))[0];
		const image = Object.values(folder.images)[0];
		if (gFolders.hasOwnProperty(folder.id) && gFolders[folder.id].images.hasOwnProperty(image.id)) {
			image.status = "refresh";
			gFolders[folder.id].images[image.id] = image;
			messageListener({ command: "POST.gallery.requestSort" }, context, webview);
			gFolders[folder.id].images[image.id].status = "";
		}
	});
	return watcher;
}

export function messageListener(message: Record<string, any>, context: vscode.ExtensionContext, webview: vscode.Webview) {
	switch (message.command) {
		case "POST.gallery.openImageViewer":
			vscode.commands.executeCommand(
				'vscode.open',
				vscode.Uri.file(message.path),
				{
					preserveFocus: false,
					preview: message.preview,
					viewColumn: vscode.ViewColumn.Two,
				},
			);
			break;
		case "POST.gallery.requestSort":
			gFolders = new CustomSorter().sort(gFolders, message.valueName, message.ascending);
		// DO NOT BREAK HERE; FALL THROUGH TO UPDATE DOMS
		case "POST.gallery.requestContentDOMs":
			const htmlProvider = new HTMLProvider(context, webview);
			const response: Record<string, any> = {};
			for (const [idx, folder] of Object.values(gFolders).entries()) {
				response[folder.id] = {
					status: "",
					barHtml: htmlProvider.folderBarHTML(folder),
					gridHtml: htmlProvider.imageGridHTML(folder, true),
					images: Object.fromEntries(
						Object.values(folder.images).map(
							image => [image.id, {
								status: image.status,
								containerHtml: htmlProvider.singleImageHTML(image),
							}]
						)
					),
				};
			}
			webview.postMessage({
				command: "POST.gallery.responseContentDOMs",
				content: JSON.stringify(response),
			});
			break;
	}
}

async function getImageUris(galleryFolder?: vscode.Uri) {
	/**
	 * Recursively get the URIs of all the images within the folder.
	 * 
	 * @param galleryFolder The folder to search. If not provided, the
	 * workspace folder will be used.
	 */
	let globPattern = utils.getGlob();
	let imgUris = await vscode.workspace.findFiles(
		galleryFolder ? new vscode.RelativePattern(galleryFolder, globPattern) : globPattern
	);
	return imgUris;
}

class CustomSorter {
	keys: Array<string>;
	options: Intl.CollatorOptions;
	comparator: (a: string, b: string) => number;

	constructor() {
		this.keys = [
			"localeMatcher",
			"sensitivity",
			"ignorePunctuation",
			"numeric",
			"caseFirst",
			"collation",
		];
		this.options = this.updateOptions();
		this.comparator = this.updateComparator(this.options);
	}

	updateOptions(configName: string = "sorting.byPathOptions") {
		const config = vscode.workspace.getConfiguration(configName);
		this.options = Object.fromEntries(this.keys.map(key => [key, config.get(key)]));
		return this.options;
	}

	updateComparator(options: Intl.CollatorOptions) {
		this.comparator = (a: string, b: string) => {
			return a.localeCompare(b, undefined, options);
		};
		return this.comparator;
	}

	sort(folders: Record<string, TFolder>, valueName: string = "path", ascending: boolean = true) {
		const sortedFolders = this.getSortedFolders(folders);
		for (const [name, folder] of Object.entries(sortedFolders)) {
			sortedFolders[name].images = Object.fromEntries(
				this.getSortedImages(Object.values(folder.images), valueName, ascending)
					.map(image => [image.id, image])
			);
		}
		return sortedFolders;
	}

	getSortedFolders(folders: Record<string, TFolder>) {
		/**
		 * Sort the folders by path in ascending order.
		 * "sorting.byPathOptions" has no effect on this.
		 */
		return Object.fromEntries(
			Object.entries(folders).sort(
				([, folder1], [, folder2]) => folder1.path.localeCompare(folder2.path)
			)
		);
	}

	getSortedImages(images: TImage[], valueName: string, ascending: boolean) {
		const sign = ascending ? +1 : -1;
		let comparator: (a: TImage, b: TImage) => number;
		switch (valueName) {
			case "ext":
				comparator = (a: TImage, b: TImage) => sign * this.comparator(a.ext, b.ext);
				break;
			case "size":
				comparator = (a: TImage, b: TImage) => sign * (a.size - b.size);
				break;
			case "ctime":
				comparator = (a: TImage, b: TImage) => sign * (a.ctime - b.ctime);
				break;
			case "mtime":
				comparator = (a: TImage, b: TImage) => sign * (a.mtime - b.mtime);
				break;
			default: // "path"
				comparator = (a: TImage, b: TImage) => sign * this.comparator(a.uri.path, b.uri.path);
		}
		return images.sort(comparator);
	}
}

class HTMLProvider {
	context: vscode.ExtensionContext;
	webview: vscode.Webview;
	placeholderUri: vscode.Uri;
	codicons: Record<string, vscode.Uri>;
	jsFileUri: vscode.Uri;
	cssFileUri: vscode.Uri;
	codiconUri: vscode.Uri;

	constructor(context: vscode.ExtensionContext, webview: vscode.Webview) {
		this.context = context;
		this.webview = webview;

		const asWebviewUri = (...args: string[]) => webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, ...args)
		);
		this.placeholderUri = asWebviewUri("media", "placeholder.jpg");
		this.codicons = {
			"expandAll": asWebviewUri("media", "expand-all.svg"),
			"collapseAll": asWebviewUri("media", "collapse-all.svg"),
			"arrowUp": asWebviewUri("media", "arrow-up.svg"),
			"arrowDown": asWebviewUri("media", "arrow-down.svg"),
			"chevronRight": asWebviewUri("media", "chevron-right.svg"),
			"chevronDown": asWebviewUri("media", "chevron-down.svg"),
		}
		this.jsFileUri = asWebviewUri("media", "gallery.js");
		this.cssFileUri = asWebviewUri("media", "gallery.css");
		this.codiconUri = asWebviewUri("node_modules", "@vscode/codicons", "dist", "codicon.css");
	}

	fullHTML(folders: Record<string, TFolder>) {
		return `
		<!DOCTYPE html>
		<html lang="en">
		<head>${this.headHTML()}</head>
		<body>${this.bodyHTML(folders)}</body>
		</html>
		`.trim();
	}

	headHTML() {
		const securityPolicyContent = [
			`default-src 'none';`,
			`script-src 'nonce-${utils.nonce}';`,
			`font-src ${this.webview.cspSource};`,
			`img-src ${this.webview.cspSource} https:;`,
			`style-src ${this.webview.cspSource};`,
		].join(' ');
		return `
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta http-equiv="Content-Security-Policy" content="${securityPolicyContent}">
		<link href="${this.cssFileUri}" rel="stylesheet" />
		<link href="${this.codiconUri}" rel="stylesheet" />
		<script defer nonce="${utils.nonce}" src="${this.jsFileUri}"></script>
		`.trim();
	}

	bodyHTML(folders: Record<string, TFolder>) {
		const nFolders = Object.keys(folders).length;
		let htmlContents: Array<string> = [];
		htmlContents.push(this.toolbarHTML(nFolders));
		htmlContents.push(`<div class="gallery-content"></div>`);
		return htmlContents.join('\n').trim();
	}

	toolbarHTML(nFolders: number) {
		return `
		<div class="toolbar">
			<div>
				<button class="codicon expand-all">
					<img src="${this.codicons["expandAll"]}" alt="Expand All" />
				</button>
				<button class="codicon collapse-all">
					<img src="${this.codicons["collapseAll"]}" alt="Collapse All"/>
				</button>
			</div>
			<div class="sort-options">
				<span>Sort by</span>
				<select id="dropdown-sort" class="dropdown">
					<option value="path">Name</option>
					<option value="ext">File type</option>
					<option value="size">File size</option>
					<option value="ctime">Created date</option>
					<option value="mtime">Modified date</option>
				</select>
				<div class="sort-order">
					<button class="sort-order-arrow codicon">
						<img
							class="sort-order-arrow-img"
							src="${this.codicons["arrowUp"]}" 
							data-arrow-up="${this.codicons["arrowUp"]}" 
							data-arrow-down="${this.codicons["arrowDown"]}" 
							alt="Sort Order"
						/>
					</button>
				</div>
			</div>
			<div class="folder-count">${nFolders} folders found</div>
		</div>
		`.trim();
	}

	folderBarHTML(folder: TFolder, collapsed: boolean = false) {
		let fsPath = this.webview.asWebviewUri(vscode.Uri.parse(folder.path)).fsPath;
		fsPath = fsPath[0].toUpperCase() + fsPath.slice(1);
		return `
		<button
			id="${folder.id}"
			data-path="${folder.path}"
			data-state="${collapsed ? 'collapsed' : 'expanded'}"
			class="folder"
		>
			<div
				id="${folder.id}-arrow"
				class="folder-arrow codicon"
			>
				<img 
					id="${folder.id}-arrow-img" 
					src="${collapsed ? this.codicons["chevronRight"] : this.codicons["chevronDown"]}" 
					data-chevron-right=${this.codicons["chevronRight"]} 
					data-chevron-down=${this.codicons["chevronDown"]} 
					alt="Sort Order"
				/>
			</div>
			<div id="${folder.id}-title" class="folder-title">${fsPath}</div>
			<div id="${folder.id}-items-count" class="folder-items-count">${Object.keys(folder.images).length} images found</div>
		</button>
		`.trim();
	}

	singleImageHTML(image: TImage) {
		const metadata = {
			ext: image.ext,
			size: image.size,
			mtime: image.mtime,
			ctime: image.ctime,
		};
		return `
		<div class="image-container tooltip">
			<span id="${image.id}-tooltip" class="tooltip tooltip-text"></span>
			<img
				id="${image.id}"
				src="${this.placeholderUri}"
				data-src="${this.webview.asWebviewUri(image.uri)}"
				data-path="${image.uri.path}"
				data-meta='${JSON.stringify(metadata)}'
				class="image unloaded"
			>
			<div id="${image.id}-filename" class="filename">${utils.getFilename(image.uri.path)}</div>
		</div>
		`.trim();
	}

	imageGridHTML(folder: TFolder, emptyContent: boolean = false) {
		const content = emptyContent ?
			"" : Object.values(folder.images).map(image => this.singleImageHTML(image)).join('\n');
		return `
		<div id="${folder.id}-grid" class="grid">${content}</div>
		`.trim();
	}
}
