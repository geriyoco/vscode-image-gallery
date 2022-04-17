import * as vscode from 'vscode';
import * as viewer_panel from './viewer_panel';

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
		webviewPanel.webview.options = {
			enableScripts: true,
			enableForms: false
		};
		let documentPath = webviewPanel.webview.asWebviewUri(document.uri).toString();
		webviewPanel.webview.html = viewer_panel.getWebviewContent(this.context, webviewPanel.webview, documentPath);
		webviewPanel.webview.postMessage({ type: 'setActive', value: webviewPanel.active });
	}
}