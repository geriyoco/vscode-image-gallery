import * as vscode from 'vscode';
import * as viewer_panel from './viewer_panel';
import * as utils from './utils';

export class ViewerCustomEditor implements vscode.CustomReadonlyEditorProvider {
	public static readonly viewType = 'gryc.editor';

	constructor(private readonly context: vscode.ExtensionContext) { }

	public async openCustomDocument(uri: vscode.Uri) {
		return { uri, dispose: () => { } };
	}

	public async resolveCustomEditor(
		document: vscode.CustomDocument,
		webviewPanel: vscode.WebviewPanel,
	): Promise<void> {
		let documentPath = webviewPanel.webview.asWebviewUri(document.uri).toString();
		let documentDir = document.uri.path.split('/').slice(0, -1).join('/');
		webviewPanel.webview.options = {
			localResourceRoots: [
				vscode.Uri.joinPath(this.context.extensionUri, 'media'),
				vscode.Uri.file(utils.getCwd()),
                vscode.Uri.file(documentDir),
            ],
			enableScripts: true,
			enableForms: false
		};
		webviewPanel.webview.html = viewer_panel.getWebviewContent(this.context, webviewPanel.webview, documentPath);
	}
}