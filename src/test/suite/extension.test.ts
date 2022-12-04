import vscode from 'vscode';
import { assert } from 'chai';

import * as utils from '../../utils';

suite('GeriYoco.vscode-image-gallery: Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('utils.nonce', () => {
		const nonce0 = utils.nonce;
		const nonce1 = utils.nonce;

		assert.strictEqual(nonce0[0], 'N');
		assert.strictEqual(nonce1[0], 'N');
		assert.isAtLeast(nonce0.length, 1 + 12);
		assert.isAtLeast(nonce1.length, 1 + 12);
		assert.strictEqual(nonce0, nonce1, 'utils.nonce should be time-independent');
	});

	test('utils.getCwd()', () => {
		const cwdSegments = utils.getCwd().split('/');
		assert.strictEqual(cwdSegments.slice(-3).join('/'), 'src/test/samples');
	});
});