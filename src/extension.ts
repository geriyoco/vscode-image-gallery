import * as vscode from 'vscode';
import * as main_panel from './main_panel';
import * as viewer_panel from './viewer_panel';
import * as viewer_editor from './viewer_editor';
import * as file_watcher from './file_watcher';


export function activate(context: vscode.ExtensionContext) {
	console.log('Welcome! VS Code extension "GeriYoco: Image Gallery" is now active.');

	const viewerEditor = new viewer_editor.ViewerCustomEditor(context);
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			viewer_editor.ViewerCustomEditor.viewType,
			viewerEditor,
			{ supportsMultipleEditorsPerDocument: true },
		)
	);

	let dispGallery = vscode.commands.registerCommand(
		'vscodeImageGallery.openGallery',
		async (galleryFolder?: vscode.Uri) => {
			const mainPanel = await main_panel.createPanel(context, galleryFolder);
			const galleryFileWatcher = file_watcher.galleryFileWatcher(mainPanel, galleryFolder);
			context.subscriptions.push(galleryFileWatcher);

			mainPanel.webview.onDidReceiveMessage(
				message => {
					switch (message.command) {
						case 'vscodeImageGallery.openViewer':
							const viewerPanel = viewer_panel.createPanel(context, message.src);
							const viewerFileWatcher = file_watcher.viewerFileWatcher(viewerPanel);

							viewerPanel.onDidDispose(
								() => {
									viewerFileWatcher.dispose();
								},
								undefined,
								context.subscriptions
							);
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
