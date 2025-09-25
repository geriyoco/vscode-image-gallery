import * as vscode from 'vscode';
import * as utils from '../utils';
import { TFolder } from 'custom_typings';
import CustomSorter from './sorter';
import HTMLProvider from '../html_provider';
import { reporter } from '../telemetry';

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
	private metadataLoadingInProgress: boolean = false;
	private metadataProgress: { loaded: number; total: number } = { loaded: 0, total: 0 };

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
		const startTime = Date.now();
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
		
		// Fast initial load - just folder structure
		const imageUris = await this.getImageUris(galleryFolder);
		this.gFolders = await utils.getFoldersStructure(imageUris);
		this.gFolders = this.customSorter.sort(this.gFolders);
		panel.webview.html = htmlProvider.fullHTML();

		// Send quick telemetry for initial load
		const totalImageCount = Object.values(this.gFolders).reduce((sum, folder) => sum + (folder.imageCount || 0), 0);
		reporter.sendTelemetryEvent('gallery.createPanel', {}, {
			"duration": Date.now() - startTime,
			"folderCount": Object.keys(this.gFolders).length,
			"imageCount": totalImageCount,
			"imageSizeMean": 0, // Will be calculated when metadata loads
			"imageSizeStd": 0,
		});


		return panel;
	}

	private async loadMetadataForSort(folders: TFolder[], sortBy: "name" | "ext" | "size" | "ctime" | "mtime", ascending: boolean, webview: vscode.Webview) {
		if (this.metadataLoadingInProgress) { return; }
		
		this.metadataLoadingInProgress = true;
		let loaded = 0;
		const total = folders.length;

		// Load folders one by one to show progress
		for (const folder of folders) {
			try {
				this.gFolders[folder.id] = await utils.loadFolderMetadata(folder);
				loaded++;
				
				// Send progress update
				webview.postMessage({
					command: "POST.gallery.metadataProgress", 
					progress: { loaded, total }
				});
			} catch (error) {
				console.error(`Failed to load metadata for folder ${folder.id}:`, error);
				loaded++;
			}
		}

		this.metadataLoadingInProgress = false;

		// Now sort with all metadata loaded
		this.gFolders = this.customSorter.sort(this.gFolders, sortBy, ascending);
		
		// Send completion and updated content
		webview.postMessage({
			command: "POST.gallery.metadataComplete"
		});
		
		this.messageListener({ command: "POST.gallery.requestContentDOMs" }, webview).catch(console.error);
	}

	public async messageListener(message: Record<string, any>, webview: vscode.Webview) {
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
				const needsMetadata = ["size", "ctime", "mtime"].includes(message.valueName);
				const unloadedFolders = Object.values(this.gFolders).filter(folder => !folder.loaded);
				
				if (needsMetadata && unloadedFolders.length > 0) {
					// Show busy indicator
					webview.postMessage({
						command: "POST.gallery.sortBusy",
						sortType: message.valueName,
						progress: { loaded: 0, total: unloadedFolders.length }
					});
					
					// Load metadata for unloaded folders only
					this.loadMetadataForSort(unloadedFolders, message.valueName, message.ascending, webview);
				} else {
					// Sort immediately
					this.gFolders = this.customSorter.sort(this.gFolders, message.valueName, message.ascending);
				}
				
				reporter.sendTelemetryEvent(`${telemetryPrefix}.requestSort`, {
					'valueName': this.customSorter.valueName,
					'ascending': this.customSorter.ascending.toString(),
				});
			// DO NOT BREAK HERE; FALL THROUGH TO UPDATE DOMS

			case "POST.gallery.loadFolderMetadata":
				const folderId = message.folderId;
				if (this.gFolders[folderId] && !this.gFolders[folderId].loaded) {
					try {
						// Load metadata for this specific folder
						this.gFolders[folderId] = await utils.loadFolderMetadata(this.gFolders[folderId]);
						
						// Send updated content for this folder
						this.messageListener({ command: "POST.gallery.requestContentDOMs" }, webview).catch(console.error);
					} catch (error) {
						console.error(`Failed to load metadata for folder ${folderId}:`, error);
					}
				}
				break;

			case "POST.gallery.requestContentDOMs":
				const htmlProvider2 = new HTMLProvider(this.context, webview);
				const response: Record<string, any> = {};
				for (const [_idx, folder] of Object.values(this.gFolders).entries()) {
					response[folder.id] = {
						status: folder.loaded ? "loaded" : "structure",
						barHtml: htmlProvider2.folderBarHTML(folder),
						gridHtml: htmlProvider2.imageGridHTML(folder, true),
						images: Object.fromEntries(
							Object.values(folder.images).map(
								image => [image.id, {
									status: image.status,
									containerHtml: htmlProvider2.singleImageHTML(image),
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
			this.messageListener({ command: "POST.gallery.requestSort" }, webview).catch(console.error);
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
			this.messageListener({ command: "POST.gallery.requestSort" }, webview).catch(console.error);
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
				this.messageListener({ command: "POST.gallery.requestSort" }, webview).catch(console.error);
				this.gFolders[folder.id].images[image.id].status = "";
			}
			reporter.sendTelemetryEvent(`${telemetryPrefix}.didChange`, {}, getMeasurementProperties(folders));
		});
		return watcher;
	}
}