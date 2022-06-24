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

	let dispGallery = vscode.commands.registerCommand(
		'vscodeImageGallery.openGallery',
		async (galleryFolder?: vscode.Uri) => {
			const mainPanel = await gallery.createPanel(context, galleryFolder);
			let collapseAll = vscode.commands.registerCommand("vscodeImageGallery.collapseAll", () => {
				mainPanel.webview.postMessage({
					command: 'vscodeImageGallery.collapseAll'
				});
			});
			let expandAll = vscode.commands.registerCommand("vscodeImageGallery.expandAll", () => {
				mainPanel.webview.postMessage({
					command: 'vscodeImageGallery.expandAll'
				});
			});


			const galleryFileWatcher = file_watcher.galleryFileWatcher(mainPanel, galleryFolder);
			context.subscriptions.push(galleryFileWatcher);
			context.subscriptions.push(collapseAll);
			context.subscriptions.push(expandAll);

			mainPanel.webview.onDidReceiveMessage(
				async message => {
					switch (message.command) {
						case 'vscodeImageGallery.openViewer':
							const resource = vscode.Uri.file(vscode.Uri.parse(message.src).path);
							await vscode.commands.executeCommand(
								'vscode.open',
								resource,
								{
									preserveFocus: true,
									preview: message.preview,
									viewColumn: vscode.ViewColumn.Two,
								},
							);
							return;
						case 'vscodeImageGallery.collapseAll':
							vscode.commands.executeCommand('setContext', 'collapse', true);
							return;
						case 'vscodeImageGallery.expandAll':
							vscode.commands.executeCommand('setContext', 'collapse', false);
							return;
					}
				},
				undefined,
				context.subscriptions,
			);

			mainPanel.onDidDispose(
				() => {
					galleryFileWatcher.dispose();
				},
				undefined,
				context.subscriptions
			);
		}
	);
	context.subscriptions.push(dispGallery);
}

export function deactivate() { }
