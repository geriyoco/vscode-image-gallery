import * as vscode from 'vscode';
import * as utils from './utils';

export function createPanel(
	context: vscode.ExtensionContext,
	imgSrc: string,
) {
	const panel = vscode.window.createWebviewPanel(
		'gryc.viewer',
		'Image Gallery: Viewer',
		vscode.ViewColumn.Two,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
		}
	);

	panel.webview.html = getWebviewContent(context, panel.webview, imgSrc);

	return panel;
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