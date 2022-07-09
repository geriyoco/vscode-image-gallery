import * as vscode from 'vscode';
import * as utils from './utils';

export async function createPanel(
    context: vscode.ExtensionContext,
    galleryFolder?: vscode.Uri,
    sortOptions = { mode: 'name', ascending: true },
) {
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
    panel.webview.html = await getWebviewContent(context, galleryFolder, panel.webview, sortOptions);
    return panel;
}

async function getImagePaths(galleryFolder?: vscode.Uri) {
    const globPattern = utils.getGlob();
    const files = await vscode.workspace.findFiles(
        galleryFolder ? new vscode.RelativePattern(galleryFolder, globPattern) : globPattern
    );
    return files;
}

function sortImagesBySubFolders(
    imagesBySubFolders: utils.TypeOfImagesBySubFolders,
    mode: string = 'name',
    ascending: boolean = true,
) {
    const config = vscode.workspace.getConfiguration('sorting.byPathOptions');
    const keys = [
        'localeMatcher',
        'sensitivity',
        'ignorePunctuation',
        'numeric',
        'caseFirst',
        'collation',
    ];
    const stringComparator = (a: string, b: string) => {
        return a.localeCompare(
            b,
            undefined,
            Object.fromEntries(keys.map(key => [key, config.get(key)]))
        );
    };

    const sign = ascending ? +1 : -1;
    const imagesComparator = (img1: utils.TypeOfImagesInSubFolders, img2: utils.TypeOfImagesInSubFolders) => {
        let comparedValue = 0;
        switch (mode) {
            case 'name':
                comparedValue = stringComparator(img1.uri.path, img2.uri.path);
                break;
            case 'type':
                comparedValue = stringComparator(img1.extension, img2.extension);
                break;
            case 'size':
                comparedValue = img1.size - img2.size;
                break;
            case 'created':
                comparedValue = img1.ctime - img2.ctime;
                break;
            case 'modified':
                comparedValue = img1.mtime - img2.mtime;
                break;
        };
        return sign * comparedValue;
    };

    const sortedResult: utils.TypeOfImagesBySubFolders = {};
    Object.keys(imagesBySubFolders).sort(stringComparator).forEach(
        subfolder => {
            sortedResult[subfolder] = imagesBySubFolders[subfolder].sort(imagesComparator);
        }
    );
    return sortedResult;
}

async function getWebviewContent(
    context: vscode.ExtensionContext,
    galleryFolder: vscode.Uri | undefined,
    webview: vscode.Webview,
    sortOptions: { mode: string, ascending: boolean },
) {
    const placeholderUrl = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'placeholder.jpg'));
    const imgPaths = await getImagePaths(galleryFolder);
    let imagesBySubFolders = await utils.getImagesBySubFolders(imgPaths);
    imagesBySubFolders = sortImagesBySubFolders(imagesBySubFolders, sortOptions.mode, sortOptions.ascending);

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
                        <span id="${img.uri.path}-tooltip" class="tooltiptext"></span>
                        <img id="${img.uri.path}" src="${placeholderUrl}" data-src="${webview.asWebviewUri(img.uri)}" data-meta='${JSON.stringify(img)}' class="image lazy">
                        <div id="${img.uri.path}-filename" class="filename">${utils.getFilename(img.uri.path)}</div>
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
    const getSelected = (value: string) => sortOptions.mode === value ? 'selected' : '';

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
                <div class="toolbar-item tooltip">
                ${Object.keys(imagesBySubFolders).length > 1 ?
                    '<button class="codicon codicon-expand-all"></button><span class="tooltiptext">Expand/Collapse all</span>' : 
                    '<button class="codicon codicon-collapse-all"></button><span class="tooltiptext">Expand/Collapse all</span>'
                }
                </div>
                <div class="sort-options">
                    <span class="codicon codicon-filter"></span>
                    <select id="dropdown-sort" class="dropdown">
                        <option value="name" ${getSelected('name')}>Name</option>
                        <option value="type" ${getSelected('type')}>File type</option>
                        <option value="size" ${getSelected('size')}>File size</option>
                        <option value="created" ${getSelected('created')}>Created date</option>
                        <option value="modified" ${getSelected('modified')}>Modified date</option>
                    </select>
                    <div class="toolbar-item tooltip">
                    ${sortOptions.ascending ?
                        '<button class="sort-order codicon codicon-arrow-up"></button><span class="tooltiptext">Ascending/Descending</span>' :
                        '<button class="sort-order codicon codicon-arrow-down"></button><span class="tooltiptext">Ascending/Descending</span>'
                    }
                    </div>
                </div>
                <div class="folder-count">${Object.keys(imagesBySubFolders).length} folders found</div>
            </div>
            ${Object.keys(imagesBySubFolders).length === 0 ? '<p>No image found in this folder.</p>' : `${imgHtml}`}
			<script nonce="${utils.nonce}" src="${scriptUri}"></script>
		</body>
		</html>`
    );
}

export async function getMessageListener(
    context: vscode.ExtensionContext,
    galleryFolder: vscode.Uri | undefined,
    panel: vscode.WebviewPanel,
    message: any,
) {
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
        case 'vscodeImageGallery.sortImages':
            panel.webview.html = await getWebviewContent(
                context,
                galleryFolder,
                panel.webview, 
                { mode: message.mode, ascending: message.ascending },
            );

            panel.webview.postMessage({
                command: 'vscodeImageGallery.restoreCollapseStates',
                folderCollapseStates: message.folderCollapseStates,
            });
            break;
    }
}