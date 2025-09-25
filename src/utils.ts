import path from 'path';
import vscode from 'vscode';
import crypto from 'crypto';
import fileSystem from 'fs';
import { TFolder } from 'custom_typings';

export let packageJSON: any; // global variable
export function readPackageJSON(context: vscode.ExtensionContext) {
	packageJSON = context.extension.packageJSON;
}

export function getCwd() {
	if (!vscode.workspace.workspaceFolders) {
		let message = "Image Gallery: Working folder not found, open a folder and try again";
		vscode.window.showErrorMessage(message);
		return '';
	}
	const cwd = vscode.workspace.workspaceFolders[0].uri.path;
	return cwd;
}

function getNonce() {
	let text = 'N';
	const possible = '0123456789ABCDEF';
	for (let i = 0; i < 16; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
export const nonce = getNonce();

function getImageExtensions() {
	const pattern = packageJSON.contributes.customEditors[0].selector[0].filenamePattern;
	const regex = /(?<=\{)(.*?)(?=\})/g;
	const match = pattern.match(regex)[0];
	const imageExtensions: string[] = match.split(',');
	return imageExtensions;
}

export function getGlob() {
	const imgExtensions = getImageExtensions();
	const upperCaseImg = imgExtensions.map(ext => ext.toUpperCase());
	const globPattern = `**/*.{${[...imgExtensions, ...upperCaseImg].join(',')}}`;
	return globPattern;
}

export function getFilename(imgPath: string) {
	const filename = decodeURI(imgPath).split("/").pop();
	if (filename) {
		return filename.split("?").shift();
	}
	return filename;
}

export function hash256(str: string, truncate = 16) {
	return 'H' + crypto.createHash('sha256').update(str).digest('hex').substring(0, truncate);
}

export async function getFileStats(imgUris: vscode.Uri[]) {
	const result = await Promise.all(imgUris.map(async (imgUri: { fsPath: any; }) => {
		var path = imgUri.fsPath;
		var stat = await fileSystem.promises.stat(path);
		return [path, stat];
	}));

	const resultObj = result.reduce((obj, item) => {
		return {
			...obj,
			[item[0]]: item[1],
		};
	}, {});

	return resultObj;
}

export async function getFoldersStructure(imgUris: vscode.Uri[]) {
	// Fast folder structure loading without file stats
	let folders: Record<string, TFolder> = {};

	for (const imgUri of imgUris) {
		const folderPath = path.dirname(imgUri.path);
		const folderId = hash256(folderPath);

		if (!folders[folderId]) {
			folders[folderId] = {
				id: folderId,
				path: folderPath,
				images: {},
				imageCount: 0,
				loaded: false
			};
		}

		// Add basic image structure without stats
		const imageId = hash256(imgUri.path);
		const dotIndex = imgUri.fsPath.lastIndexOf('.');
		folders[folderId].images[imageId] = {
			id: imageId,
			uri: imgUri,
			ext: imgUri.fsPath.slice(dotIndex + 1).toUpperCase(),
			size: 0, // Placeholder
			mtime: 0,
			ctime: 0,
			status: "",
			loaded: false
		};
		folders[folderId].imageCount = (folders[folderId].imageCount || 0) + 1;
	}
	return folders;
}

export async function loadFolderMetadata(folder: TFolder) {
	// Load file stats only for this folder's images
	const imageUris = Object.values(folder.images).map(img => img.uri);
	const fileStats = await getFileStats(imageUris);
	
	// Update images with real metadata
	for (const image of Object.values(folder.images)) {
		const stat = fileStats[image.uri.fsPath as keyof typeof fileStats];
		if (stat) {
			image.size = stat['size'];
			image.mtime = new Date(stat['mtime']).getTime();
			image.ctime = new Date(stat['ctime']).getTime();
			image.loaded = true;
		}
	}
	
	folder.loaded = true;
	return folder;
}

export async function getFolders(imgUris: vscode.Uri[], action: "create" | "change" | "delete" = "create") {
	// Keep original function for backward compatibility (file watchers, etc.)
	let folders: Record<string, TFolder> = {};

	let fileStats;
	if (action !== "delete") {
		fileStats = await getFileStats(imgUris);
	}
	for (const imgUri of imgUris) {
		const folderPath = path.dirname(imgUri.path);
		const folderId = hash256(folderPath);

		if (!folders[folderId]) { // first image of the folder
			folders[folderId] = {
				id: folderId,
				path: folderPath,
				images: {},
				imageCount: 0,
				loaded: true
			};
		}

		if (action !== 'delete' && fileStats !== undefined) {
			const fileStat = fileStats[imgUri.fsPath as keyof typeof fileStats];
			const dotIndex = imgUri.fsPath.lastIndexOf('.');
			const imageId = hash256(imgUri.path);
			folders[folderId].images[imageId] = {
				id: imageId,
				uri: imgUri,
				ext: imgUri.fsPath.slice(dotIndex + 1).toUpperCase(),
				size: fileStat['size'],
				mtime: new Date(fileStat['mtime']).getTime(),
				ctime: new Date(fileStat['ctime']).getTime(),
				status: "",
				loaded: true
			};
			folders[folderId].imageCount = (folders[folderId].imageCount || 0) + 1;
		}
	}
	return folders;
}

export function getImageSizeStat(folders: Record<string, TFolder>) {
	const sizes: number[] = [];
	for (const folderId in folders) {
		for (const imageId in folders[folderId].images) {
			sizes.push(folders[folderId].images[imageId].size);
		}
	}
	const count = sizes.length;
	const sum = (a: number, b: number) => a + b;
	const mean = (count > 0) ? sizes.reduce(sum, 0) / count : 0;
	const std = (count > 1) ? Math.sqrt(sizes.map(x => Math.pow(x - mean, 2)).reduce(sum, 0) / count) : 0;

	return {
		count,
		mean: Math.round(mean),
		std: Math.round(std),
	};
}