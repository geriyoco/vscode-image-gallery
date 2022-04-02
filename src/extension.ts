import * as vscode from 'vscode';
import * as main_panel from './main_panel';
import * as viewer_panel from './viewer_panel';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, extension "vscode-image-gallery" is now active!');

	let disposable = vscode.commands.registerCommand('vscode-image-gallery.start', async () => {
		const mainPanel = await main_panel.createPanel(context);
		
		mainPanel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'vscode-image-gallery.openImageViewer':
						viewer_panel.createPanel(context, mainPanel.webview, message.src);
						return;
				}
			},
			undefined,
			context.subscriptions,
		);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
