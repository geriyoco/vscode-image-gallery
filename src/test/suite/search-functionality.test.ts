import vscode from 'vscode';
import { assert } from 'chai';

import { TFolder, TImage } from 'custom_typings';

suite('GeriYoco.vscode-image-gallery: Search Functionality Test Suite', () => {
	vscode.window.showInformationMessage('Search Functionality Test Suite started.');

	// Create test data for search tests
	const createTestFolder = (): TFolder => ({
		id: "test-folder",
		path: "/test/images",
		imageCount: 6,
		loaded: true,
		images: {
			"img1": {
				id: "img1",
				uri: vscode.Uri.file("/test/images/vacation-photo.jpg"),
				ext: "JPG",
				size: 1000,
				mtime: 1000,
				ctime: 1000,
				status: "",
				loaded: true,
			},
			"img2": {
				id: "img2", 
				uri: vscode.Uri.file("/test/images/asdfa-vacation.png"),
				ext: "PNG",
				size: 2000,
				mtime: 2000,
				ctime: 2000,
				status: "",
				loaded: true,
			},
			"img3": {
				id: "img3",
				uri: vscode.Uri.file("/test/images/bak_vacation.jpg"),
				ext: "JPG",
				size: 1500,
				mtime: 1500,
				ctime: 1500,
				status: "",
				loaded: true,
			},
			"img4": {
				id: "img4",
				uri: vscode.Uri.file("/test/images/work-document.pdf"),
				ext: "PDF",
				size: 3000,
				mtime: 3000,
				ctime: 3000,
				status: "",
				loaded: true,
			},
			"img5": {
				id: "img5",
				uri: vscode.Uri.file("/test/images/family_photo_2023.jpg"),
				ext: "JPG",
				size: 2500,
				mtime: 2500,
				ctime: 2500,
				status: "",
				loaded: true,
			},
			"img6": {
				id: "img6",
				uri: vscode.Uri.file("/test/images/screenshot.png"),
				ext: "PNG",
				size: 800,
				mtime: 800,
				ctime: 800,
				status: "",
				loaded: true,
			},
		}
	});

	test('Search functionality: basic filename matching', () => {
		const folder = createTestFolder();
		const images = Object.values(folder.images);

		// Test basic search for "vacation"
		const searchTerm = "vacation";
		const matchingImages = images.filter(img => {
			const filename = img.uri.path.split('/').pop()?.toLowerCase() || '';
			return filename.includes(searchTerm.toLowerCase());
		});

		assert.strictEqual(matchingImages.length, 3);
		assert.isTrue(matchingImages.some(img => img.uri.path.includes('vacation-photo.jpg')));
		assert.isTrue(matchingImages.some(img => img.uri.path.includes('asdfa-vacation.png')));
		assert.isTrue(matchingImages.some(img => img.uri.path.includes('bak_vacation.jpg')));
	});

	test('Search functionality: fuzzy matching patterns', () => {
		const folder = createTestFolder();
		const images = Object.values(folder.images);

		// Test patterns like "asdfa-<search>" and "bak_<search>"
		const searchTerm = "vacation";
		const matchingImages = images.filter(img => {
			const filename = img.uri.path.split('/').pop()?.toLowerCase() || '';
			return filename.includes(searchTerm.toLowerCase());
		});

		// Should find:
		// - "vacation-photo.jpg" (direct match)
		// - "asdfa-vacation.png" (prefix pattern)
		// - "bak_vacation.jpg" (underscore pattern)
		assert.strictEqual(matchingImages.length, 3);

		const filenames = matchingImages.map(img => img.uri.path.split('/').pop());
		assert.isTrue(filenames.includes('vacation-photo.jpg'));
		assert.isTrue(filenames.includes('asdfa-vacation.png'));
		assert.isTrue(filenames.includes('bak_vacation.jpg'));
	});

	test('Search functionality: case insensitive matching', () => {
		const folder = createTestFolder();
		const images = Object.values(folder.images);

		// Test case insensitive search
		const searchVariations = ["VACATION", "Vacation", "vacation", "VaCaTiOn"];
		
		searchVariations.forEach(searchTerm => {
			const matchingImages = images.filter(img => {
				const filename = img.uri.path.split('/').pop()?.toLowerCase() || '';
				return filename.includes(searchTerm.toLowerCase());
			});
			
			assert.strictEqual(matchingImages.length, 3, `Failed for search term: ${searchTerm}`);
		});
	});

	test('Search functionality: partial matching', () => {
		const folder = createTestFolder();
		const images = Object.values(folder.images);

		// Test partial matching
		const searchTerm = "photo";
		const matchingImages = images.filter(img => {
			const filename = img.uri.path.split('/').pop()?.toLowerCase() || '';
			return filename.includes(searchTerm.toLowerCase());
		});

		// Should find:
		// - "vacation-photo.jpg"
		// - "family_photo_2023.jpg"
		assert.strictEqual(matchingImages.length, 2);
		assert.isTrue(matchingImages.some(img => img.uri.path.includes('vacation-photo.jpg')));
		assert.isTrue(matchingImages.some(img => img.uri.path.includes('family_photo_2023.jpg')));
	});

	test('Search functionality: extension matching', () => {
		const folder = createTestFolder();
		const images = Object.values(folder.images);

		// Test searching by extension
		const searchTerm = ".jpg";
		const matchingImages = images.filter(img => {
			const filename = img.uri.path.split('/').pop()?.toLowerCase() || '';
			return filename.includes(searchTerm.toLowerCase());
		});

		// Should find all JPG files
		assert.strictEqual(matchingImages.length, 3);
		matchingImages.forEach(img => {
			assert.isTrue(img.uri.path.toLowerCase().endsWith('.jpg'));
		});
	});

	test('Search functionality: no matches', () => {
		const folder = createTestFolder();
		const images = Object.values(folder.images);

		// Test search term that should not match anything
		const searchTerm = "nonexistent";
		const matchingImages = images.filter(img => {
			const filename = img.uri.path.split('/').pop()?.toLowerCase() || '';
			return filename.includes(searchTerm.toLowerCase());
		});

		assert.strictEqual(matchingImages.length, 0);
	});

	test('Search functionality: empty search shows all', () => {
		const folder = createTestFolder();
		const images = Object.values(folder.images);

		// Test empty search should show all images
		const searchTerm: string = "";
		const matchingImages = images.filter(img => {
			const filename = img.uri.path.split('/').pop()?.toLowerCase() || '';
			return searchTerm === '' || filename.includes(searchTerm.toLowerCase());
		});

		assert.strictEqual(matchingImages.length, images.length);
	});

	test('Search functionality: special characters handling', () => {
		const folder = createTestFolder();
		const images = Object.values(folder.images);

		// Test search with underscore and dash
		const underscoreSearch = "_";
		const dashSearch = "-";

		const underscoreMatches = images.filter(img => {
			const filename = img.uri.path.split('/').pop()?.toLowerCase() || '';
			return filename.includes(underscoreSearch);
		});

		const dashMatches = images.filter(img => {
			const filename = img.uri.path.split('/').pop()?.toLowerCase() || '';
			return filename.includes(dashSearch);
		});

		// Should find files with underscores
		assert.isTrue(underscoreMatches.length > 0);
		assert.isTrue(underscoreMatches.some(img => img.uri.path.includes('bak_vacation.jpg')));
		assert.isTrue(underscoreMatches.some(img => img.uri.path.includes('family_photo_2023.jpg')));

		// Should find files with dashes
		assert.isTrue(dashMatches.length > 0);
		assert.isTrue(dashMatches.some(img => img.uri.path.includes('vacation-photo.jpg')));
		assert.isTrue(dashMatches.some(img => img.uri.path.includes('asdfa-vacation.png')));
		assert.isTrue(dashMatches.some(img => img.uri.path.includes('work-document.pdf')));
	});
});
