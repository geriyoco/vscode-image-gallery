import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';

export let reporter: ExtensionReporter;

export function activate(context: vscode.ExtensionContext) {
    reporter = new ExtensionReporter(context);
    context.subscriptions.push(reporter);
}

export function deactivate() {
    if (!reporter) { return; }
    reporter.dispose();
}

export class ExtensionReporter extends TelemetryReporter {
    constructor(
        context: vscode.ExtensionContext,
        private readonly instrumentationKey = "a5e759de-afbd-4f36-a9c9-2fc95385683b",
    ) {
        const packageJson = context.extension.packageJSON;
        const extId = packageJson.publisher + '.' + packageJson.name;
        const extVersion = packageJson.version;
        super(extId, extVersion, instrumentationKey);
    }
}
