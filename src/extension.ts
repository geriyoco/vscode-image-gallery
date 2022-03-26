import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, extension "vscode-image-gallery" is now active!');

	let disposable = vscode.commands.registerCommand('vscode-image-gallery.start', async () => {
		const img_extensions = [
			'jpg',
			'jpeg',
			'png',
			'gif',
			'webp',
		]
		const files = await vscode.workspace.findFiles('**/*.{' + img_extensions.join(',') + '}');
		const img_paths = files.map(
			file => vscode.Uri.file(file.fsPath)
		);

		const panel = vscode.window.createWebviewPanel(
			'meowCoding',
			'Meow Coding',
			vscode.ViewColumn.One,

			{
				localResourceRoots: [vscode.Uri.file(context.extensionPath)]
			}
		)
		const img_webviewUris = img_paths.map(
			img_path => panel.webview.asWebviewUri(img_path)
		);
		panel.webview.html = getWebviewContent(img_webviewUris);

		vscode.window.showInformationMessage('Image Gallery is now active!');
	});
	context.subscriptions.push(disposable);
}

function getWebviewContent(img_webviewUris: vscode.Uri[]) {
	const img_html = img_webviewUris.map(
		img => `<img src="${img}" style="height: 100px;">`
	).join('\n');
	console.log(img_html);

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Meow Coding</title>
</head>
<body>
	<h1>GRYC Image Gallery</h1>
	${img_html}
</body>
</html>`;
}

export function deactivate() {}
