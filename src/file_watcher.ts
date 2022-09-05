import * as vscode from 'vscode';
import * as utils from './utils';

export function galleryFileWatcher(mainPanel: vscode.WebviewPanel, galleryFolder?: vscode.Uri) {
    const globPattern = utils.getGlob();
    const watcher = vscode.workspace.createFileSystemWatcher(
        galleryFolder ?
        new vscode.RelativePattern(galleryFolder, globPattern) : globPattern
    );
    // watcher.onDidCreate(async uri => {
    //     const folders = await utils.getFolders([uri], "create");
    //     mainPanel.webview.postMessage({
    //         command: "POST.gallery.createImage",
    //         imgSrc: mainPanel.webview.asWebviewUri(uri).toString(),
    //         imgPath: uri.path,
    //         folders: folders,
    //     });
    // });
    // watcher.onDidChange(async uri => {
    //     const folders = await utils.getFolders([uri], "change");
    //     mainPanel.webview.postMessage({
    //         command: "POST.gallery.changeImage",
    //         imgSrc: mainPanel.webview.asWebviewUri(uri).toString(),
    //         imgPath: uri.path,
    //         folders: folders,
    //     });
    // });
    // watcher.onDidDelete(async uri => {
    //     const folders = await utils.getFolders([uri], "delete");
    //     mainPanel.webview.postMessage({
    //         command: "POST.gallery.deleteImage",
    //         imgSrc: mainPanel.webview.asWebviewUri(uri).toString(),
    //         imgPath: uri.path,
    //         folders: folders,
    //     });
    // });

    return watcher;
}