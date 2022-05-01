import * as vscode from 'vscode';
import * as utils from './utils';

export async function createPanel(context: vscode.ExtensionContext, galleryFolder?: vscode.Uri) {
    const panel = vscode.window.createWebviewPanel(
        'gryc.gallery',
        'Image Gallery',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );

    const imgPaths = await getImagePaths(galleryFolder);
    panel.webview.html = getWebviewContent(context, panel.webview, imgPaths);

    return panel;
}

export async function getImagePaths(galleryFolder?: vscode.Uri) {
    const globPattern = utils.getGlob();
    const files = await vscode.workspace.findFiles(
        galleryFolder ? new vscode.RelativePattern(galleryFolder, globPattern) : globPattern
    );
    return files;
}

export function getWebviewContent(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    imgWebviewUris: vscode.Uri[],
) {
    const placeholderUrl = "https://www.prowebdesign.ro/wp-content/uploads/2012/12/2-150x150.jpg";
    const imgHtml = imgWebviewUris.map(
        img => {
            return `
            <div class="image-container">
                <img id="${img.path}" src="${placeholderUrl}" data-src="${webview.asWebviewUri(img)}" class="image lazy">
                <div id="${img.path}-filename" class="filename">${utils.getFilename(img.path)}</div>
            </div>
            `;
        }
    ).join('\n');

    const styleHref = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'gallery.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'gallery.js'));

    return (
        `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${utils.nonce}'; img-src ${webview.cspSource} https:; style-src ${webview.cspSource};">
			<link href="${styleHref}" rel="stylesheet" />
			<title>Image Gallery</title>
		</head>
		<body>
            ${imgWebviewUris.length === 0 ? '<p>No image found in this folder.</p>' : `<div class="grid">${imgHtml}</div>`}
			<script nonce="${utils.nonce}" src="${scriptUri}"></script>
		</body>
		</html>`
    );
}