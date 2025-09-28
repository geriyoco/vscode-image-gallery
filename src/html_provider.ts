import * as vscode from 'vscode';
import * as utils from './utils';
import { TImage, TFolder } from 'custom_typings';

export default class HTMLProvider {
	placeholderUri: vscode.Uri;
	codicons: Record<string, vscode.Uri>;
	jsFileUri: vscode.Uri;
	cssFileUri: vscode.Uri;

	constructor(private readonly context: vscode.ExtensionContext, private webview: vscode.Webview) {
		this.webview = webview;

		const asWebviewUri = (...args: string[]) => webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, ...args)
		);
		this.placeholderUri = asWebviewUri("assets", "placeholder.jpg");
		this.codicons = {
			"expandAll": asWebviewUri("assets", "expand-all.svg"),
			"collapseAll": asWebviewUri("assets", "collapse-all.svg"),
			"arrowUp": asWebviewUri("assets", "arrow-up.svg"),
			"arrowDown": asWebviewUri("assets", "arrow-down.svg"),
			"chevronRight": asWebviewUri("assets", "chevron-right.svg"),
			"chevronDown": asWebviewUri("assets", "chevron-down.svg"),
		};
		this.jsFileUri = asWebviewUri("src", "gallery", "script.js");
		this.cssFileUri = asWebviewUri("src", "gallery", "style.css");
	}

	fullHTML() {
		return `
		<!DOCTYPE html>
		<html lang="en">
		<head>${this.headHTML()}</head>
		<body>${this.bodyHTML()}</body>
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
		<script defer nonce="${utils.nonce}" src="${this.jsFileUri}"></script>
		`.trim();
	}

	bodyHTML() {
		let htmlContents: Array<string> = [];
		htmlContents.push(this.toolbarHTML());
		htmlContents.push(`<div class="gallery-content"></div>`);
		return htmlContents.join('\n').trim();
	}

	toolbarHTML() {
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
					<option value="name">Name</option>
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
			<div class="column-control">
				<span>Columns</span>
				<div class="column-input-group">
					<input type="number" id="column-count" class="column-input" min="1" max="100" value="4" />
					<div class="column-arrows">
						<button class="column-arrow codicon" data-direction="up">
							<img src="${this.codicons["arrowUp"]}" alt="Increase columns" />
						</button>
						<button class="column-arrow codicon" data-direction="down">
							<img src="${this.codicons["arrowDown"]}" alt="Decrease columns" />
						</button>
					</div>
				</div>
				<label class="auto-checkbox">
					<input type="checkbox" id="auto-columns" checked />
					<span>Auto</span>
				</label>
			</div>
			<div class="folder-count"></div>
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
			<div id="${folder.id}-items-count" class="folder-items-count"></div>
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
