import * as vscode from 'vscode';
import * as utils from '../utils';
import { TFolder } from 'custom_typings';
import CustomSorter from './sorter';
import HTMLProvider from '../html_provider';

export class GalleryWebview {
	private gFolders: Record<string, TFolder> = {};
	private customSorter: CustomSorter = new CustomSorter();

	constructor(private readonly context: vscode.ExtensionContext) { }

	private async getImageUris(galleryFolder?: vscode.Uri | string) {
		/**
		 * Recursively get the URIs of all the images within the folder.
		 * 
		 * @param galleryFolder The folder to search. If not provided, the
		 * workspace folder will be used.
		 */
		let globPattern = utils.getGlob();
		let imgUris = await vscode.workspace.findFiles(
			galleryFolder ? new vscode.RelativePattern(galleryFolder, globPattern) : globPattern
		);
		return imgUris;
	}

	public async createPanel(galleryFolder?: vscode.Uri) {
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

		const htmlProvider = new HTMLProvider(this.context, panel.webview);
		const imageUris = await this.getImageUris(galleryFolder);
		this.gFolders = await utils.getFolders(imageUris);
		this.gFolders = this.customSorter.sort(this.gFolders);
		panel.webview.html = htmlProvider.fullHTML(this.gFolders);
		return panel;
	}

	public messageListener(message: Record<string, any>, webview: vscode.Webview) {
		switch (message.command) {
			case "POST.gallery.openImageViewer":
				vscode.commands.executeCommand(
					'vscode.open',
					vscode.Uri.file(message.path),
					{
						preserveFocus: false,
						preview: message.preview,
						viewColumn: vscode.ViewColumn.Two,
					},
				);
				break;
			case "POST.gallery.requestSort":
				this.gFolders = this.customSorter.sort(this.gFolders, message.valueName, message.ascending);
			// DO NOT BREAK HERE; FALL THROUGH TO UPDATE DOMS
			case "POST.gallery.requestContentDOMs":
				const htmlProvider = new HTMLProvider(this.context, webview);
				const response: Record<string, any> = {};
				for (const [idx, folder] of Object.values(this.gFolders).entries()) {
					response[folder.id] = {
						status: "",
						barHtml: htmlProvider.folderBarHTML(folder),
						gridHtml: htmlProvider.imageGridHTML(folder, true),
						images: Object.fromEntries(
							Object.values(folder.images).map(
								image => [image.id, {
									status: image.status,
									containerHtml: htmlProvider.singleImageHTML(image),
								}]
							)
						),
					};
				}
				webview.postMessage({
					command: "POST.gallery.responseContentDOMs",
					content: JSON.stringify(response),
				});
				break;
		}
	}

	public createFileWatcher(webview: vscode.Webview, galleryFolder?: vscode.Uri) {
		const globPattern = utils.getGlob();
		const watcher = vscode.workspace.createFileSystemWatcher(
			galleryFolder ?
				new vscode.RelativePattern(galleryFolder, globPattern) : globPattern
		);
		watcher.onDidCreate(async uri => {
			const folder = Object.values(await utils.getFolders([uri], "create"))[0];
			const image = Object.values(folder.images)[0];
			if (this.gFolders.hasOwnProperty(folder.id)) {
				if (!this.gFolders[folder.id].images.hasOwnProperty(image.id)) {
					this.gFolders[folder.id].images[image.id] = image;
				}
			} else {
				this.gFolders[folder.id] = folder;
			}
			this.messageListener({ command: "POST.gallery.requestSort" }, webview);
		});
		watcher.onDidDelete(async uri => {
			const folder = Object.values(await utils.getFolders([uri], "delete"))[0];
			const imageId = utils.hash256(webview.asWebviewUri(uri).path);
			if (this.gFolders.hasOwnProperty(folder.id)) {
				if (this.gFolders[folder.id].images.hasOwnProperty(imageId)) {
					delete this.gFolders[folder.id].images[imageId];
				}
				if (Object.keys(this.gFolders[folder.id].images).length === 0) {
					delete this.gFolders[folder.id];
				}
			}
			this.messageListener({ command: "POST.gallery.requestSort" }, webview);
		});
		watcher.onDidChange(async uri => {
			// rename is NOT handled here; it's handled automatically by Delete & Create
			// hence we can assume imageId and folderId to be the same
			const folder = Object.values(await utils.getFolders([uri], "change"))[0];
			const image = Object.values(folder.images)[0];
			if (this.gFolders.hasOwnProperty(folder.id) && this.gFolders[folder.id].images.hasOwnProperty(image.id)) {
				image.status = "refresh";
				this.gFolders[folder.id].images[image.id] = image;
				this.messageListener({ command: "POST.gallery.requestSort" }, webview);
				this.gFolders[folder.id].images[image.id].status = "";
			}
		});
		return watcher;
	}
}