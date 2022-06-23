import * as vscode from 'vscode';
import * as utils from './utils';

export function galleryFileWatcher(mainPanel: vscode.WebviewPanel, galleryFolder?: vscode.Uri) {
    let globPattern = utils.getGlob();
    const watcher = vscode.workspace.createFileSystemWatcher(galleryFolder ? new vscode.RelativePattern(galleryFolder, globPattern) : globPattern);
    watcher.onDidChange(uri => {
        let pathsBySubFolders = utils.getPathsBySubFolders([uri]);
        mainPanel.webview.postMessage({
            command: 'vscodeImageGallery.changeImage',
            imgSrc: mainPanel.webview.asWebviewUri(uri).toString(),
            imgPath: uri.path,
            pathsBySubFolders: pathsBySubFolders,
        });
    });
    watcher.onDidCreate(uri => {
        let pathsBySubFolders = utils.getPathsBySubFolders([uri]);
        mainPanel.webview.postMessage({
            command: 'vscodeImageGallery.addImage',
            imgSrc: mainPanel.webview.asWebviewUri(uri).toString(),
            imgPath: uri.path,
            pathsBySubFolders: pathsBySubFolders,
        });
    });
    watcher.onDidDelete(uri => {
        let pathsBySubFolders = utils.getPathsBySubFolders([uri]);
        mainPanel.webview.postMessage({
            command: 'vscodeImageGallery.deleteImage',
            imgSrc: mainPanel.webview.asWebviewUri(uri).toString(),
            imgPath: uri.path,
            pathsBySubFolders: pathsBySubFolders,
        });
    });

    return watcher;
}

export function viewerFileWatcher(viewerPanel: vscode.WebviewPanel) {
    let globPattern = utils.getGlob();
    const watcher = vscode.workspace.createFileSystemWatcher(globPattern, true, false, false);
    watcher.onDidChange(uri => {
        viewerPanel.webview.postMessage({
            command: 'vscodeImageGalleryViewer.changeImage',
            imgSrc: viewerPanel.webview.asWebviewUri(uri).toString(),
        });
    });
    watcher.onDidDelete(uri => {
        viewerPanel.dispose();
    });

    return watcher;
}