import vscode from 'vscode';
import { assert } from 'chai';

import * as utils from '../../utils';

suite('GeriYoco.vscode-image-gallery: Utils Test Suite', () => {
	vscode.window.showInformationMessage('Utils Test Suite started.');

	test('utils.nonce: generates consistent nonce', () => {
		const nonce1 = utils.nonce;
		const nonce2 = utils.nonce;

		// Should be the same (time-independent)
		assert.strictEqual(nonce1, nonce2);
		
		// Should start with 'N' and be at least 13 characters
		assert.strictEqual(nonce1[0], 'N');
		assert.isAtLeast(nonce1.length, 13);
	});

	test('utils.getGlob: returns valid glob pattern', () => {
		const glob = utils.getGlob();
		
		// Should be a string with proper glob format
		assert.isString(glob);
		assert.isTrue(glob.startsWith('**/*.{'));
		assert.isTrue(glob.endsWith('}'));
		
		// Should contain common image extensions
		assert.isTrue(glob.includes('jpg'));
		assert.isTrue(glob.includes('png'));
		assert.isTrue(glob.includes('JPG'));
		assert.isTrue(glob.includes('PNG'));
	});

	test('utils.getFilename: extracts filename correctly', () => {
		// Test with various path formats
		const testCases = [
			{ input: '/path/to/image.jpg', expected: 'image.jpg' },
			{ input: '/path/to/image.jpg?query=param', expected: 'image.jpg' },
			{ input: 'image.png', expected: 'image.png' },
			{ input: '/folder/subfolder/vacation-photo.jpeg', expected: 'vacation-photo.jpeg' },
			{ input: '', expected: undefined },
		];

		testCases.forEach(({ input, expected }) => {
			const result = utils.getFilename(input);
			assert.strictEqual(result, expected, `Failed for input: ${input}`);
		});
	});

	test('utils.hash256: generates consistent hashes', () => {
		const testString = 'test-string-for-hashing';
		
		// Should generate same hash for same input
		const hash1 = utils.hash256(testString);
		const hash2 = utils.hash256(testString);
		assert.strictEqual(hash1, hash2);
		
		// Should start with 'H' and be 17 characters by default (H + 16 hex chars)
		assert.strictEqual(hash1[0], 'H');
		assert.strictEqual(hash1.length, 17);
		
		// Different inputs should produce different hashes
		const differentHash = utils.hash256('different-string');
		assert.notStrictEqual(hash1, differentHash);
	});

	test('utils.hash256: respects truncate parameter', () => {
		const testString = 'test-string-for-hashing';
		
		// Test with custom truncate length
		const hash8 = utils.hash256(testString, 8);
		const hash12 = utils.hash256(testString, 12);
		
		assert.strictEqual(hash8.length, 9); // H + 8 chars
		assert.strictEqual(hash12.length, 13); // H + 12 chars
		
		// Should be prefixes of each other
		assert.isTrue(hash12.startsWith(hash8));
	});

	test('utils.getImageSizeStat: calculates statistics correctly', () => {
		// Create test folders with known image sizes
		const testFolders = {
			'folder1': {
				id: 'folder1',
				path: '/test/folder1',
				imageCount: 3,
				loaded: true,
				images: {
					'img1': {
						id: 'img1',
						uri: vscode.Uri.file('/test/folder1/img1.jpg'),
						ext: 'JPG',
						size: 100,
						mtime: 1000,
						ctime: 1000,
						status: "" as const,
						loaded: true,
					},
					'img2': {
						id: 'img2',
						uri: vscode.Uri.file('/test/folder1/img2.jpg'),
						ext: 'JPG', 
						size: 200,
						mtime: 2000,
						ctime: 2000,
						status: "" as const,
						loaded: true,
					},
					'img3': {
						id: 'img3',
						uri: vscode.Uri.file('/test/folder1/img3.jpg'),
						ext: 'JPG',
						size: 300,
						mtime: 3000,
						ctime: 3000,
						status: "" as const,
						loaded: true,
					},
				}
			}
		};

		const stats = utils.getImageSizeStat(testFolders);
		
		// Should have correct count
		assert.strictEqual(stats.count, 3);
		
		// Should have correct mean (100 + 200 + 300) / 3 = 200
		assert.strictEqual(stats.mean, 200);
		
		// Should have reasonable standard deviation (should be > 0 for varied sizes)
		assert.isTrue(stats.std > 0);
	});

	test('utils.getImageSizeStat: handles empty folders', () => {
		const emptyFolders = {};
		const stats = utils.getImageSizeStat(emptyFolders);
		
		assert.strictEqual(stats.count, 0);
		assert.strictEqual(stats.mean, 0);
		assert.strictEqual(stats.std, 0);
	});

	test('utils.getImageSizeStat: handles single image', () => {
		const singleImageFolder = {
			'folder1': {
				id: 'folder1',
				path: '/test/folder1',
				imageCount: 1,
				loaded: true,
				images: {
					'img1': {
						id: 'img1',
						uri: vscode.Uri.file('/test/folder1/img1.jpg'),
						ext: 'JPG',
						size: 500,
						mtime: 1000,
						ctime: 1000,
						status: "" as const,
						loaded: true,
					},
				}
			}
		};

		const stats = utils.getImageSizeStat(singleImageFolder);
		
		assert.strictEqual(stats.count, 1);
		assert.strictEqual(stats.mean, 500);
		assert.strictEqual(stats.std, 0); // Single value has no deviation
	});
});
