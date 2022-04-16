import * as vscode from 'vscode';
import * as main_panel from './main_panel';
import * as viewer_panel from './viewer_panel';
import * as viewer_editor from './viewer_editor';

export function activate(context: vscode.ExtensionContext) {
	console.log('Welcome! VS Code extension "GeriYoco: Image Gallery" is now active.');

	const viewerEditor = new viewer_editor.ViewerCustomEditor(context.extensionUri);
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
			
			mainPanel.webview.onDidReceiveMessage(
				message => {
					switch (message.command) {
						case 'vscodeImageGallery.openViewer':
							viewer_panel.createPanel(context, message.src);
							return;
					}
				},
				undefined,
				context.subscriptions,
			);
		}
	);
	context.subscriptions.push(dispGallery);
}

export function deactivate() {}
