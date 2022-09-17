import * as vscode from 'vscode';
import { activate as activateViewer } from './viewer/viewer';
import { activate as activateGallery } from './gallery/gallery';
import { activate as activateReporter } from './telemetry';

let viewerDisposable: vscode.Disposable;
let galleryDisposable: vscode.Disposable;
let reporterDisposable: vscode.Disposable;

export function activate(context: vscode.ExtensionContext) {
	viewerDisposable = activateViewer(context);
	galleryDisposable = activateGallery(context);
	reporterDisposable = activateReporter(context);
}

export function deactivate() {
	if (viewerDisposable) { viewerDisposable.dispose(); }
	if (galleryDisposable) { galleryDisposable.dispose(); }
	if (reporterDisposable) { reporterDisposable.dispose(); }
}
