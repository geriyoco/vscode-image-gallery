import * as vscode from 'vscode';

export function getCwd() {
	if (!vscode.workspace.workspaceFolders) {
		let message = "Image Gallery: Working folder not found, open a folder and try again";
		vscode.window.showErrorMessage(message);
		return '';
	}
	let cwd = vscode.workspace.workspaceFolders[0].uri.path;
	let message = `Image Gallery current folder: ${cwd}`;
	vscode.window.showInformationMessage(message);
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
		'avif',
		'bmp',
		'gif',
		'ico',
		'jpg',
		'jpe',
		'jpeg',
		'jif',
		'jfif',
		'jfi',
		'png',
		'webp',
		'svg',
	];
	let upperCaseImg = imgExtensions.map(ext => ext.toUpperCase());
	const globPattern = '**/*.{' + [...imgExtensions, ...upperCaseImg].join(',') + '}';
	return globPattern;
}