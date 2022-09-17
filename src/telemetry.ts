import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';

export function activate(context: vscode.ExtensionContext) {
    const reporter = new ExtensionReporter(context);
    context.subscriptions.push(reporter);
    return reporter;
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
