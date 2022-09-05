import * as vscode from 'vscode';
import * as gallery from './gallery';
import * as viewer from './viewer';

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
			const panel = await gallery.createPanel(context, galleryFolder);
			panel.webview.onDidReceiveMessage(
				message => gallery.messageListener(message, context, panel.webview),
				undefined,
				context.subscriptions
			);

			const fileWatcher = gallery.createFileWatcher(context, panel.webview, galleryFolder);
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
