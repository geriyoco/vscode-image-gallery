import * as vscode from 'vscode';

export type TImage = {
    id: string, // hash256(imageUri.path), e.g. hash256("/c:/Users/image.jpg")
	uri: vscode.Uri,
	ext: string, // file extension in upper case, e.g. "JPG"
	size: number,
	mtime: number,
	ctime: number,
};

export type TFolder = {
	id: string, // hash256(folderUri.path), e.g. hash256("/c:/Users")
	path: string, // folderUri.path, e.g. "/c:/Users"
	images: {
		[imageId: string]: TImage,
	},
};
