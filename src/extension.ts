import * as vscode from 'vscode';
import * as gallery from './gallery';
import * as viewer from './viewer';
import * as file_watcher from './file_watcher';


export function activate(context: vscode.ExtensionContext) {
	console.log('Welcome! VS Code extension "GeriYoco: Image Gallery" is now active.');

	const viewerEditor = new viewer.ViewerCustomEditor(context);
	const viewerPanel = vscode.window.registerCustomEditorProvider(
		viewer.ViewerCustomEditor.viewType,
		viewerEditor,
		{
			supportsMultipleEditorsPerDocument: true,
			webviewOptions: {
				retainContextWhenHidden: true,
			}
		},
	);
	context.subscriptions.push(viewerPanel);

	const disposableGallery = vscode.commands.registerCommand(
		'vscodeImageGallery.openGallery',
		async (galleryFolder?: vscode.Uri) => {
			const galleryPanel = await gallery.createPanel(context, galleryFolder);
			const galleryFileWatcher = file_watcher.galleryFileWatcher(galleryPanel, galleryFolder);
			context.subscriptions.push(galleryFileWatcher);

			galleryPanel.webview.onDidReceiveMessage(
				message => gallery.messageListener(message, context, galleryPanel.webview),
				undefined,
				context.subscriptions
			);
			galleryPanel.onDidDispose(
				() => galleryFileWatcher.dispose(),
				undefined,
				context.subscriptions
			);
		}
	);
	context.subscriptions.push(disposableGallery);
}

export function deactivate() { }
