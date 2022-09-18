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
        public readonly enableTelemetry: boolean = getUserTelemetrySetting(),
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
        if (!this.enableTelemetry) { return; }
        if (this.verbose) {
            console.log(`Telemetry event: ${eventName}`, properties, measurements);
        }
        super.sendTelemetryEvent(eventName, properties, measurements);
    }
}

function getUserTelemetrySetting() {
    const globalTelemetryIsEnabled: (
        "all" | "error" | "crash" | "off" | undefined
    ) = vscode.workspace.getConfiguration('telemetry').get('telemetryLevel');
    if (!(globalTelemetryIsEnabled === "all" || globalTelemetryIsEnabled === undefined)) {
        // our extension only collects "Usage Data", allowed by "all" only
        return false;
    }

    const globalIsTelemetryEnabled: (
        boolean | undefined
    ) = vscode.workspace.getConfiguration('telemetry').get('isTelemetryEnabled');
    if (globalIsTelemetryEnabled === false) { return false; }

    const globalOnDidChangeTelemetryEnabled: (
        boolean | undefined
    ) = vscode.workspace.getConfiguration('telemetry').get('onDidChangeTelemetryEnabled');
    if (globalOnDidChangeTelemetryEnabled === false) { return false; }

    const extensionIsTelemetryEnabled: (
        boolean | undefined
    ) = vscode.workspace.getConfiguration('telemetry.geriyocoImageGallery').get('isTelemetryEnabled');
    if (extensionIsTelemetryEnabled === false) { return false; }

    return true;
}