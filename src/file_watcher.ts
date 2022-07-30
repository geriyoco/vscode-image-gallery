import * as vscode from 'vscode';
import * as utils from './utils';

export function galleryFileWatcher(mainPanel: vscode.WebviewPanel, galleryFolder?: vscode.Uri) {
    let globPattern = utils.getGlob();
    const watcher = vscode.workspace.createFileSystemWatcher(galleryFolder ? new vscode.RelativePattern(galleryFolder, globPattern) : globPattern);
    watcher.onDidChange(async uri => {
        let imagesBySubFolders = await utils.getImagesBySubFolders([uri], 'change');
        mainPanel.webview.postMessage({
            command: 'vscodeImageGallery.changeImage',
            imgSrc: mainPanel.webview.asWebviewUri(uri).toString(),
            imgPath: uri.path,
            imagesBySubFolders: imagesBySubFolders,
        });
    });
    watcher.onDidCreate(async uri => {
        let imagesBySubFolders = await utils.getImagesBySubFolders([uri], 'create');
        mainPanel.webview.postMessage({
            command: 'vscodeImageGallery.addImage',
            imgSrc: mainPanel.webview.asWebviewUri(uri).toString(),
            imgPath: uri.path,
            imagesBySubFolders: imagesBySubFolders,
        });
    });
    watcher.onDidDelete(async uri => {
        let imagesBySubFolders = await utils.getImagesBySubFolders([uri], 'delete');
        mainPanel.webview.postMessage({
            command: 'vscodeImageGallery.deleteImage',
            imgSrc: mainPanel.webview.asWebviewUri(uri).toString(),
            imgPath: uri.path,
            imagesBySubFolders: imagesBySubFolders,
        });
    });

    return watcher;
}