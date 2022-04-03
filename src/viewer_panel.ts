import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';

export function createPanel(
	context: vscode.ExtensionContext,
	webview: vscode.Webview,
	imgSrc: string,
) {
	const panel = vscode.window.createWebviewPanel(
		'imagegallery',
		'Image Gallery: Viewer',
		vscode.ViewColumn.Two,
		{
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.file(
					utils.getCwd()),
				vscode.Uri.file(path.join(context.extensionPath, 'media'),
				),
			],
		},
	);

	panel.webview.html = getWebviewContent(context, webview, imgSrc);

	return panel;
}

export function getWebviewContent(
	context: vscode.ExtensionContext,
	webview: vscode.Webview,
	imgSrc: string,
) {
	const styleHref = webview.asWebviewUri(
		vscode.Uri.joinPath(context.extensionUri, 'media', 'viewer.css')
	);

	const scriptUri = vscode.Uri.joinPath(
		context.extensionUri, 'media', 'viewer.js'
	).with({
		'scheme': 'vscode-resource'
	});

	// <div id="container" class="center" draggable = "true" >
	// 	<img id="container" src = "${imgSrc}" >
	// 		</div>

	// const nonce = utils.getNonce();

	return (
		`<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Security-Policy" content="img-src ${webview.cspSource} https:; style-src ${webview.cspSource};">

			<link href="${styleHref}" rel="stylesheet" />

			<title>Image Gallery: Viewer</title>
			</head>
		<body>
			<div id="container">
				<img id="image" src="${imgSrc}" ondragstart="return false;" draggable="true">
			</div>
				
			<script nonce="${utils.nonce}" src="${scriptUri}"></script>
		</body>
		</html>`
	);
}