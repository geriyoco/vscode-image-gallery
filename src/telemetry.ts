import * as vscode from 'vscode';
import TelemetryReporter, {
    TelemetryEventMeasurements, TelemetryEventProperties
} from '@vscode/extension-telemetry';

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
        public verbose = false, // true for development; false for production
        private readonly instrumentationKey = "a5e759de-afbd-4f36-a9c9-2fc95385683b",
    ) {
        const packageJson = context.extension.packageJSON;
        const extId = packageJson.publisher + '.' + packageJson.name;
        const extVersion = packageJson.version;
        super(extId, extVersion, instrumentationKey);
    }

    public sendTelemetryEvent(
        eventName: string,
        properties?: TelemetryEventProperties | undefined,
        measurements?: TelemetryEventMeasurements | undefined,
    ) {
        if (this.verbose) {
            console.log(`Telemetry event: ${eventName}`, properties, measurements);
        }
        super.sendTelemetryEvent(eventName, properties, measurements);
    }
}
