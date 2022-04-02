import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, extension "vscode-image-gallery" is now active!');

	let disposable = vscode.commands.registerCommand('vscode-image-gallery.start', async () => {
		const panel = vscode.window.createWebviewPanel(
			'imagegallery',
			'Image Gallery',
			vscode.ViewColumn.One,
			{
				localResourceRoots: [vscode.Uri.file(getCwd()), vscode.Uri.file(path.join(context.extensionPath, 'media'))],
				enableScripts: true
			}
		);
		const imgExtensions = [
			'jpg',
			'jpeg',
			'png',
			'gif',
			'webp',
		];
		const files = await vscode.workspace.findFiles('**/*.{' + imgExtensions.join(',') + '}');
		const imgPaths = files.map(file => vscode.Uri.file(file.fsPath));
		const imgWebviewUris = imgPaths.map(
			imgPath => panel.webview.asWebviewUri(imgPath)
		);
		panel.webview.html = getWebviewContent(context, panel.webview, imgWebviewUris);
	});
	context.subscriptions.push(disposable);
}

function getCwd() {
	if (!vscode.workspace.workspaceFolders) {
		let message = "Image Gallery: Working folder not found, open a folder an try again";
		vscode.window.showErrorMessage(message);
		return '';
	}
	var cwd = vscode.workspace.workspaceFolders[0].uri.path;
	let message = `Image Gallery: folder: ${cwd}`;
	vscode.window.showInformationMessage(message);
	return cwd;
}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview, imgWebviewUris: vscode.Uri[]) {
	const imgHtml = imgWebviewUris.map(img => `<img src="${img}" class="image lozad">`).join('\n');
	const stylesGallery = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'gallery.css'));
	const scriptUri = vscode.Uri.joinPath(context.extensionUri, 'media', 'gallery.js').with({ 'scheme': 'vscode-resource' });
	const nonce = getNonce();
	return (
		`<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource};">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			
			<link href="${stylesGallery}" rel="stylesheet" />

			<title>Image Gallery</title>
		</head>
		<body>
			<div class="grid">
				<div>
					${imgHtml}
				</div>
			</div>
			
			<script nonce="${nonce}" src="${scriptUri}"></script>
		</body>
		</html>`
	);
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function deactivate() {}
