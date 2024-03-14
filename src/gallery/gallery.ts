import * as vscode from 'vscode';
import * as utils from '../utils';
import { TFolder } from 'custom_typings';
import CustomSorter from './sorter';
import HTMLProvider from '../html_provider';
import { reporter } from '../telemetry';
import { minimatch } from 'minimatch';

export let disposable: vscode.Disposable;

export function activate(context: vscode.ExtensionContext) {
	const gallery = new GalleryWebview(context);
	disposable = vscode.commands.registerCommand('gryc.openGallery',
		async (galleryFolder?: vscode.Uri) => {
			const panel = await gallery.createPanel(galleryFolder);
			panel.webview.onDidReceiveMessage(
				message => gallery.messageListener(message, panel.webview),
				undefined,
				context.subscriptions,
			);

			const fileWatcher = gallery.createFileWatcher(panel.webview, galleryFolder);
			context.subscriptions.push(fileWatcher);
			panel.onDidDispose(
				() => fileWatcher.dispose(),
				undefined,
				context.subscriptions,
			);
	});
	context.subscriptions.push(disposable);
	reporter.sendTelemetryEvent('gallery.activate');
}

export function deactivate() {
	if (!disposable) { return; }
	disposable.dispose();
	reporter.sendTelemetryEvent('gallery.deactivate');
}

class GalleryWebview {
	private gFolders: Record<string, TFolder> = {};
	private customSorter: CustomSorter = new CustomSorter();

	constructor(private readonly context: vscode.ExtensionContext) { }

	private async parseTxt(path: vscode.Uri, globPattern: string) {
		/**
		 * Parse the TXT file and extract the URIs of the images from lines matching the glob pattern.
		 * 
		 * @param path The path to the TXT file.
		 * @param globPattern The glob pattern to match the lines.
		 */
		let fileContents = (await vscode.workspace.openTextDocument(path)).getText();
		let fileLines = fileContents.split('\n');
		let validPaths = fileLines.filter((line) => minimatch(line, globPattern));
		let validUris = validPaths.map((path) => vscode.Uri.file(path));
		return validUris;
	}

	private async getImageUris(galleryTarget?: vscode.Uri) {
		/**
		 * Recursively get the URIs of all the images within the folder.
		 * 
		 * @param galleryTarget The TXT/folder to search. If not provided, the
		 * workspace folder will be used.
		 */
		vscode.window.showInformationMessage("Gallery target:"+galleryTarget);
		let globPattern = utils.getGlob();
		if (galleryTarget?.toString().endsWith('.txt')) {
			return await this.parseTxt(galleryTarget, globPattern);
		}
		else { // assume the target is a folder
			return await vscode.workspace.findFiles(
				galleryTarget ? new vscode.RelativePattern(galleryTarget, globPattern) : globPattern
			);
		}
	}

	public async createPanel(galleryFolder?: vscode.Uri) {
		const startTime = Date.now();
		vscode.commands.executeCommand('setContext', 'ext.viewType', 'gryc.gallery');
		const imageUris = await this.getImageUris(galleryFolder);
		this.gFolders = await utils.getFolders(imageUris);
		this.gFolders = this.customSorter.sort(this.gFolders);
		const panel = vscode.window.createWebviewPanel(
			'gryc.gallery',
			`Image Gallery${galleryFolder ? ': ' + utils.getFilename(galleryFolder.path) : ''}`,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.file('/'),
				// adding all directories is not needded
				// ideally would only add the ones containing images
				]
			}
		);
		panel.webview.options.localResourceRoots
		const htmlProvider = new HTMLProvider(this.context, panel.webview);
		panel.webview.html = htmlProvider.fullHTML();

		const imageSizeStat = utils.getImageSizeStat(this.gFolders);
		reporter.sendTelemetryEvent('gallery.createPanel', {}, {
			"duration": Date.now() - startTime,
			"folderCount": Object.keys(this.gFolders).length,
			"imageCount": imageSizeStat.count,
			"imageSizeMean": imageSizeStat.mean,
			"imageSizeStd": imageSizeStat.std,
		});

		return panel;
	}

	public messageListener(message: Record<string, any>, webview: vscode.Webview) {
		const telemetryPrefix = "gallery.messageListener";
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
				reporter.sendTelemetryEvent(`${telemetryPrefix}.openImageViewer`, {
					'preview': message.preview.toString(),
				});
				break;

			case "POST.gallery.requestSort":
				this.gFolders = this.customSorter.sort(this.gFolders, message.valueName, message.ascending);
				reporter.sendTelemetryEvent(`${telemetryPrefix}.requestSort`, {
					'valueName': this.customSorter.valueName,
					'ascending': this.customSorter.ascending.toString(),
				});
			// DO NOT BREAK HERE; FALL THROUGH TO UPDATE DOMS

			case "POST.gallery.requestContentDOMs":
				const htmlProvider = new HTMLProvider(this.context, webview);
				const response: Record<string, any> = {};
				for (const [_idx, folder] of Object.values(this.gFolders).entries()) {
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
				const imageSizeStat = utils.getImageSizeStat(this.gFolders);
				reporter.sendTelemetryEvent(`${telemetryPrefix}.requestContentDOMs`, {}, {
					"folderCount": Object.keys(this.gFolders).length,
					"imageCount": imageSizeStat.count,
					"imageSizeMean": imageSizeStat.mean,
					"imageSizeStd": imageSizeStat.std,
				});
				break;
		}
	}

	public createFileWatcher(webview: vscode.Webview, galleryFolder?: vscode.Uri) {
		const telemetryPrefix = "gallery.createFileWatcher";
		const getMeasurementProperties = (folders: Record<string, TFolder>) => ({
			"folderCount": Object.keys(folders).length,
			"imageCount": Object.values(folders).reduce((acc, folder) => acc + Object.keys(folder.images).length, 0),
		});

		const globPattern = utils.getGlob();
		const watcher = vscode.workspace.createFileSystemWatcher(
			galleryFolder ?
				new vscode.RelativePattern(galleryFolder, globPattern) : globPattern
		);
		watcher.onDidCreate(async uri => {
			const folders = await utils.getFolders([uri], "create");
			const folder = Object.values(folders)[0];
			const image = Object.values(folder.images)[0];
			if (this.gFolders.hasOwnProperty(folder.id)) {
				if (!this.gFolders[folder.id].images.hasOwnProperty(image.id)) {
					this.gFolders[folder.id].images[image.id] = image;
				}
			} else {
				this.gFolders[folder.id] = folder;
			}
			this.messageListener({ command: "POST.gallery.requestSort" }, webview);
			reporter.sendTelemetryEvent(`${telemetryPrefix}.didCreate`, {}, getMeasurementProperties(folders));
		});
		watcher.onDidDelete(async uri => {
			const folders = await utils.getFolders([uri], "delete");
			const folder = Object.values(folders)[0];
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
			reporter.sendTelemetryEvent(`${telemetryPrefix}.didDelete`, {}, getMeasurementProperties(folders));
		});
		watcher.onDidChange(async uri => {
			// rename is NOT handled here; it's handled automatically by Delete & Create
			// hence we can assume imageId and folderId to be the same
			const folders = await utils.getFolders([uri], "change");
			const folder = Object.values(folders)[0];
			const image = Object.values(folder.images)[0];
			if (this.gFolders.hasOwnProperty(folder.id) && this.gFolders[folder.id].images.hasOwnProperty(image.id)) {
				image.status = "refresh";
				this.gFolders[folder.id].images[image.id] = image;
				this.messageListener({ command: "POST.gallery.requestSort" }, webview);
				this.gFolders[folder.id].images[image.id].status = "";
			}
			reporter.sendTelemetryEvent(`${telemetryPrefix}.didChange`, {}, getMeasurementProperties(folders));
		});
		return watcher;
	}
}