import * as vscode from 'vscode';
import { ViewerWebview } from './viewer/viewer';
import { GalleryWebview } from './gallery/gallery';

export function activate(context: vscode.ExtensionContext) {
	console.log('Welcome! VS Code extension "GeriYoco: Image Gallery" is now active.');

	const viewer = new ViewerWebview(context);
	const viewerPanel = vscode.window.registerCustomEditorProvider(
		ViewerWebview.viewType,
		viewer,
		{
			supportsMultipleEditorsPerDocument: true,
			webviewOptions: {
				retainContextWhenHidden: true,
			}
		},
	);
	context.subscriptions.push(viewerPanel);

	const gallery = new GalleryWebview(context);
	const disposableGallery = vscode.commands.registerCommand(
		'gryc.openGallery',
		async (galleryFolder?: vscode.Uri) => {
			const panel = await gallery.createPanel(galleryFolder);
			panel.webview.onDidReceiveMessage(
				message => gallery.messageListener(message, panel.webview),
				undefined,
				context.subscriptions
			);

			const fileWatcher = gallery.createFileWatcher(panel.webview, galleryFolder);
			context.subscriptions.push(fileWatcher);
			panel.onDidDispose(
				() => fileWatcher.dispose(),
				undefined,
				context.subscriptions
			);
		}
	);
	context.subscriptions.push(disposableGallery);
}

export function deactivate() { }
