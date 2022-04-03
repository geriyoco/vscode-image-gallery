import * as vscode from 'vscode';

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
	return (
		`<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">

			<link href="${styleHref}" rel="stylesheet" />

			<title>Image Gallery: Viewer</title>
		</head>
		<body>
			<div>
				<img src="${imgSrc}" class="image">
			</div>
		</body>
		</html>`
	);
}