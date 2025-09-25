import * as vscode from 'vscode';

export interface TelemetryEventProperties {
    [key: string]: string;
}

export interface TelemetryEventMeasurements {
    [key: string]: number;
}

export let reporter: ExtensionReporter;

export function activate(context: vscode.ExtensionContext) {
    reporter = new ExtensionReporter();
    // No need to push to subscriptions since this is a no-op
}

export function deactivate() {
    // No-op
}

export class ExtensionReporter {
    constructor() {
        // No-op telemetry reporter
    }

    public sendTelemetryEvent(
        eventName: string,
        properties?: TelemetryEventProperties | undefined,
        measurements?: TelemetryEventMeasurements | undefined,
    ) {
        // Telemetry disabled - no-op
    }

    public dispose() {
        // No-op
    }
}