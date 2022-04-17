import * as vscode from 'vscode';
import * as utils from './utils';

export class ViewerCustomEditor implements vscode.CustomReadonlyEditorProvider {
	public static readonly viewType = 'gryc.editor';

	constructor(private readonly extensionUri: vscode.Uri) { }

	public async openCustomDocument(uri: vscode.Uri) {
		return { uri, dispose: () => { } };
	}

	public async resolveCustomEditor(
		imageDocument: vscode.CustomDocument,
		viewerPanel: vscode.WebviewPanel,
	) : Promise<void> {
		const webview = new ViewerWebview(this.extensionUri, imageDocument.uri, viewerPanel);
		vscode.commands.executeCommand('setContext', 'imagePreviewFocus', !!webview);
	}
}

class ViewerWebview {
	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly imageUri: vscode.Uri,
		private readonly viewerPanel: vscode.WebviewPanel,
	) {
		imageUri = viewerPanel.webview.asWebviewUri(imageUri);

		const resourceRoot = imageUri.with({
			path: imageUri.path.replace(/\/[^\/]+?\.\w+$/, '/'),
		});

		viewerPanel.webview.options = {
			enableScripts: true,
			enableForms: false,
			localResourceRoots: [
				vscode.Uri.file(utils.getCwd()),
				resourceRoot,
				extensionUri,
			]
		};

		(async () => {
			this.viewerPanel.webview.html = await this.getWebviewContent();
		})();

		this.viewerPanel.webview.postMessage({ type: 'setActive', value: this.viewerPanel.active });
	}

	private async getWebviewContent(): Promise<string> {
		const webview = this.viewerPanel.webview;
		const media = {
			src: await (async () => {
				return webview.asWebviewUri(this.imageUri).toString();
			})(),
			style: this.getAsWebviewUri('/media/viewer.css'),
			script: this.getAsWebviewUri('/media/viewer.js'),
		};

		return (
			`<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="img-src ${webview.cspSource} https:; script-src 'nonce-${utils.nonce}'; style-src ${webview.cspSource};">
				<link href="${media.style}" rel="stylesheet" />
				<script nonce="${utils.nonce}" src='https://unpkg.com/panzoom@9.4.0/dist/panzoom.min.js'></script>
			</head>
			<body>
				<div id="container">
					<img id="image" src="${media.src}" />
				</div>
				<script nonce="${utils.nonce}" src='${media.script}'></script>
			</body>
			</html>`
		);
	}

	private getAsWebviewUri(path: string) {
		return this.viewerPanel.webview.asWebviewUri(
			this.extensionUri.with({
				path: this.extensionUri.path + path
			})
		);
	}
}