import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';

export async function createPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'imagegallery',
        'Image Gallery',
        vscode.ViewColumn.One,
        {
            localResourceRoots: [
                vscode.Uri.file(
                    utils.getCwd()),
                    vscode.Uri.file(path.join(context.extensionPath, 'media'),
                ),
            ],
            enableScripts: true,
        }
    );

    const imgPaths = await getImagePaths();
    const imgWebviewUris = imgPaths.map(
        imgPath => panel.webview.asWebviewUri(imgPath)
    );
    panel.webview.html = getWebviewContent(context, panel.webview, imgWebviewUris);

    return panel;
}

export async function getImagePaths() {
    const imgExtensions = [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
    ];
    const files = await vscode.workspace.findFiles('**/*.{' + imgExtensions.join(',') + '}');
    const imgPaths = files.map(
        file => vscode.Uri.file(file.fsPath)
    );
    return imgPaths;
}

export function getWebviewContent(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    imgWebviewUris: vscode.Uri[],
) {
	const imgHtml = imgWebviewUris.map(
        img => `<img src="${img}" class="image lozad">`
    ).join('\n');

	const styleHref = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'media', 'gallery.css')
    );

	const scriptUri = vscode.Uri.joinPath(
        context.extensionUri, 'media', 'gallery.js'
    ).with({
        'scheme': 'vscode-resource'
    });

	const nonce = utils.getNonce();

	return (
		`<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource};">
			
            <script nonce="${nonce}" type="text/javascript" src="https://cdn.jsdelivr.net/npm/lozad/dist/lozad.min.js"></script>
			<link href="${styleHref}" rel="stylesheet" />

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