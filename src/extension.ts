import * as vscode from 'vscode';
import * as main_panel from './main_panel';
import * as viewer_panel from './viewer_panel';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, extension "VS Code Image Gallery" is now active!');

	let disposable = vscode.commands.registerCommand(
		'vscodeImageGallery.openGallery',
		async (galleryFolder?: vscode.Uri) => {
			const mainPanel = await main_panel.createPanel(context, galleryFolder);
			
			mainPanel.webview.onDidReceiveMessage(
				message => {
					switch (message.command) {
						case 'vscodeImageGallery.openImageViewer':
							viewer_panel.createPanel(context, mainPanel.webview, message.src);
							return;
					}
				},
				undefined,
				context.subscriptions,
			);
		}
	);

	context.subscriptions.push(disposable);
}

export function deactivate() {}
