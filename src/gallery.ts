import * as vscode from 'vscode';
import * as utils from './utils';

export async function createPanel(context: vscode.ExtensionContext, galleryFolder?: vscode.Uri) {
    vscode.commands.executeCommand('setContext', 'ext.viewType', 'gryc.gallery');
    const panel = vscode.window.createWebviewPanel(
        'gryc.gallery',
        `Image Gallery${galleryFolder ? ': ' + utils.getFilename(galleryFolder.path) : ''}`,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );

    const imgPaths = await getImagePaths(galleryFolder);
    let imagesBySubFolders = await utils.getImagesBySubFolders(imgPaths);
    imagesBySubFolders = sortImagesBySubFolders(imagesBySubFolders);

    panel.webview.html = getWebviewContent(context, panel.webview, imagesBySubFolders);

    return panel;
}

async function getImagePaths(galleryFolder?: vscode.Uri) {
    const globPattern = utils.getGlob();
    const files = await vscode.workspace.findFiles(
        galleryFolder ? new vscode.RelativePattern(galleryFolder, globPattern) : globPattern
    );
    return files;
}

function sortImagesBySubFolders(imagesBySubFolders: utils.TypeOfImagesBySubFolders) {
    const config = vscode.workspace.getConfiguration('sorting.byPathOptions');
    const keys = [
        'localeMatcher',
        'sensitivity',
        'ignorePunctuation',
        'numeric',
        'caseFirst',
        'collation',
    ];
    const comparator = (a: string, b: string) => {
        return a.localeCompare(
            b,
            undefined,
            Object.fromEntries(keys.map(key => [key, config.get(key)]))
        );
    };

    const sortedResult: utils.TypeOfImagesBySubFolders = {};
    type Image = utils.TypeOfImagesInSubFolders; // alias
    Object.keys(imagesBySubFolders).sort(comparator).forEach(
        subfolder => {
            sortedResult[subfolder] = imagesBySubFolders[subfolder].sort(
                (img1: Image, img2: Image) => comparator(img1.imgUri.path, img2.imgUri.path)
            );
        }
    );

    return sortedResult;
}

function getWebviewContent(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    imagesBySubFolders: utils.TypeOfImagesBySubFolders,
) {
    const placeholderUrl = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'placeholder.jpg'));
    const imgHtml = Object.keys(imagesBySubFolders).map(
        (folder, index) => {
            return `
            <button id="${folder}" class="folder">
                <div id="${folder}-arrow" class="folder-arrow">⮟</div>
                <div id="${folder}-title" class="folder-title">${folder}</div>
                <div id="${folder}-items-count" class="folder-items-count">${imagesBySubFolders[folder].length} images found</div>
            </button>
            <div id="${folder}-grid" class="grid grid-${index}">
                ${imagesBySubFolders[folder].map(img => {
                return `
                    <div class="image-container tooltip">
                        <span id="${img.imgUri.path}-tooltip" class="tooltiptext"></span>
                        <img id="${img.imgUri.path}" src="${placeholderUrl}" data-src="${webview.asWebviewUri(img.imgUri)}" data-meta='${JSON.stringify(img.imgMetadata)}' class="image lazy">
                        <div id="${img.imgUri.path}-filename" class="filename">${utils.getFilename(img.imgUri.path)}</div>
                    </div>
                    `;
            }).join('')}
            </div>
            `;
        }
    ).join('\n');

    const styleHref = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'gallery.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'gallery.js'));
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

    return (
        `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${utils.nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; style-src ${webview.cspSource};">
			<link href="${styleHref}" rel="stylesheet" />
			<link href="${codiconsUri}" rel="stylesheet" />
			<title>Image Gallery</title>
		</head>
		<body>
            <div class="toolbar">
                ${Object.keys(imagesBySubFolders).length > 1 ?
            '<button class="codicon codicon-expand-all"></button>' :
            '<button class="codicon codicon-collapse-all"></button>'
        }
                <div class="folder-count">${Object.keys(imagesBySubFolders).length} folders found</div>
            </div>
            ${Object.keys(imagesBySubFolders).length === 0 ? '<p>No image found in this folder.</p>' : `${imgHtml}`}
			<script nonce="${utils.nonce}" src="${scriptUri}"></script>
		</body>
		</html>`
    );
}

export function getMessageListener(message: any) {
    switch (message.command) {
        case 'vscodeImageGallery.openViewer':
            vscode.commands.executeCommand(
                'vscode.open',
                vscode.Uri.file(vscode.Uri.parse(message.src).path),
                {
                    preserveFocus: false,
                    preview: message.preview,
                    viewColumn: vscode.ViewColumn.Two,
                },
            );
            break;
    }
}