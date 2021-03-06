import path from 'path';
import * as vscode from 'vscode';
import * as utils from './utils';

export class ViewerCustomEditor implements vscode.CustomReadonlyEditorProvider {
	public static readonly viewType = 'gryc.editor';

	constructor(private readonly context: vscode.ExtensionContext) { }

	public async openCustomDocument(uri: vscode.Uri) {
		return { uri, dispose: () => { } };
	}

	public async resolveCustomEditor(
		document: vscode.CustomDocument,
		webviewPanel: vscode.WebviewPanel,
	): Promise<void> {
		let documentPath = webviewPanel.webview.asWebviewUri(document.uri).toString();
		let documentDir = path.dirname(document.uri.fsPath);
		webviewPanel.webview.options = {
			localResourceRoots: [
				vscode.Uri.joinPath(this.context.extensionUri, 'media'),
				vscode.Uri.file(utils.getCwd()),
				vscode.Uri.file(documentDir),
			],
			enableScripts: true,
			enableForms: false
		};
		webviewPanel.webview.html = getWebviewContent(this.context, webviewPanel.webview, documentPath);
	}
}

export function getWebviewContent(
	context: vscode.ExtensionContext,
	webview: vscode.Webview,
	imgSrc: string,
) {
	const styleHref = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'viewer.css'));
	const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'viewer.js'));

	return (
		`<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Security-Policy" content="img-src ${webview.cspSource} https:; script-src 'nonce-${utils.nonce}'; style-src ${webview.cspSource};">
			<link href="${styleHref}" rel="stylesheet" />
			<script nonce="${utils.nonce}" src='https://unpkg.com/panzoom@9.4.0/dist/panzoom.min.js'></script>

			<title>Image Gallery: Viewer</title>
			</head>
		<body>
			<div id="container">
				<img id="image" src="${imgSrc}">
			</div>
				
			<script nonce="${utils.nonce}" src="${scriptUri}"></script>
		</body>
		</html>`
	);
}