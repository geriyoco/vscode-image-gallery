import path from 'path';
import * as vscode from 'vscode';

export function getCwd() {
	if (!vscode.workspace.workspaceFolders) {
		let message = "Image Gallery: Working folder not found, open a folder and try again";
		vscode.window.showErrorMessage(message);
		return '';
	}
	let cwd = vscode.workspace.workspaceFolders[0].uri.path;
	return cwd;
}

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export const nonce = getNonce();

export function getGlob() {
	const imgExtensions = [
		'ai',
		'avif',
		'bmp',
		'dib',
		'gif',
		'heif',
		'heic',
		'eps',
		'ico',
		'ind',
		'indd',
		'indt',
		'jp2',
		'j2k',
		'jpf',
		'jpx',
		'jpm',
		'mj2',
		'jpg',
		'jpe',
		'jpeg',
		'jpg_orig',
		'jif',
		'jfif',
		'jfi',
		'tif',
		'tiff',
		'psd',
		'png',
		'raw',
		'arw',
		'cr2',
		'nrw',
		'k25',
		'webp',
		'svg',
		'svgz',
	];
	let upperCaseImg = imgExtensions.map(ext => ext.toUpperCase());
	const globPattern = `**/*.{${[...imgExtensions, ...upperCaseImg].join(',')}}`;
	return globPattern;
}

export function getFilename(imgPath: string) {
	let filename = decodeURI(imgPath).split("/").pop();

	if (filename) {
		return filename.split("?").shift();
	}
	return filename;
}

export type TypeOfImagesInSubFolders = {
	imgUri: vscode.Uri,
	imgMetadata: vscode.FileStat | null,
};

export type TypeOfImagesBySubFolders = {
	[key: string]: Array<TypeOfImagesInSubFolders>,
};

export async function getImagesBySubFolders(imgPaths: vscode.Uri[], action: string = 'create') {
	let imagesBySubFolders: TypeOfImagesBySubFolders = {};
	let imgMetadata = null;
	for (const imgUri of imgPaths) {
		let key = path.dirname(imgUri.fsPath);
		key = key[0].toUpperCase() + key.slice(1,);
		if (!imagesBySubFolders[key]) {
			imagesBySubFolders[key] = [];
		}
		if (action !== 'delete') {
			imgMetadata = await vscode.workspace.fs.stat(imgUri);
		}
		imagesBySubFolders[key].push({
			"imgUri": imgUri,
			"imgMetadata": imgMetadata
		});
	}
	return imagesBySubFolders;
}