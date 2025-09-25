import vscode from 'vscode';
import { assert } from 'chai';

import CustomSorter from '../..//gallery/sorter';
// import * as utils from '../../utils';
import { TFolder } from 'custom_typings';

class TestObjects {
	folder1: TFolder = {
		id: "folder1",
		path: "/home/user/folder1",
		imageCount: 2,
		loaded: true,
		images: {
			"image1": {
				id: "fold1_img1",
				uri: vscode.Uri.file("/home/user/folder1/image1.jpg"),
				ext: "JPG",
				size: 100,
				mtime: 1000,
				ctime: 1000,
				status: "",
				loaded: true,
			},
			"image2": {
				id: "fold1_img2",
				uri: vscode.Uri.file("/home/user/folder1/image2.png"),
				ext: "PNG",
				size: 200,
				mtime: 800,
				ctime: 1200,
				status: "",
				loaded: true,
			},
		}
	};

	folder2: TFolder = {
		id: "folder2",
		path: "/home/user/folder2",
		imageCount: 1,
		loaded: true,
		images: {
			"image3": {
				id: "fold2_img3",
				uri: vscode.Uri.file("/home/user/folder2/image3.jpeg"),
				ext: "JPEG",
				size: 300,
				mtime: 1500,
				ctime: 1100,
				status: "",
				loaded: true,
			},
		}
	};

	folderUnloaded: TFolder = {
		id: "folder3",
		path: "/home/user/folder3",
		imageCount: 1,
		loaded: false,
		images: {
			"image4": {
				id: "fold3_img4",
				uri: vscode.Uri.file("/home/user/folder3/image4.jpg"),
				ext: "JPG",
				size: 0,
				mtime: 0,
				ctime: 0,
				status: "",
				loaded: false,
			},
		}
	};
}

suite("GeriYoco.vscode-image-gallery: Gallery Test Suite", () => {
	vscode.window.showInformationMessage("Gallery Test Suite started.");

	test("CustomSorter.constructor()", () => {
		const sorter = new CustomSorter();
		
		// check default values
		assert.strictEqual(sorter.valueName, 'name');
		assert.strictEqual(sorter.ascending, true);
	});

	test("CustomSorter.sort(): sort by name", () => {
		const obj = new TestObjects();
		const sorter = new CustomSorter();
		const result = sorter.sort(
			{"folder1": obj.folder1, "folder2": obj.folder2},
			"name",
			true, // ascending
		);

		assert.strictEqual(
			Object.values(result.folder1.images).map(image => image.id).join(","),
			"fold1_img1,fold1_img2"
		);
	});

	test("CustomSorter.sort(): sort by size ascending", () => {
		const obj = new TestObjects();
		const sorter = new CustomSorter();
		const result = sorter.sort(
			{"folder1": obj.folder1},
			"size",
			true
		);

		// Should sort by size: image1 (100) before image2 (200)
		const imageIds = Object.values(result.folder1.images).map(image => image.id);
		assert.strictEqual(imageIds[0], "fold1_img1");
		assert.strictEqual(imageIds[1], "fold1_img2");
	});

	test("CustomSorter.sort(): sort by size descending", () => {
		const obj = new TestObjects();
		const sorter = new CustomSorter();
		const result = sorter.sort(
			{"folder1": obj.folder1},
			"size",
			false
		);

		// Should sort by size descending: image2 (200) before image1 (100)
		const imageIds = Object.values(result.folder1.images).map(image => image.id);
		assert.strictEqual(imageIds[0], "fold1_img2");
		assert.strictEqual(imageIds[1], "fold1_img1");
	});

	test("CustomSorter.sort(): sort by modified time", () => {
		const obj = new TestObjects();
		const sorter = new CustomSorter();
		const result = sorter.sort(
			{"folder1": obj.folder1},
			"mtime",
			true
		);

		// Should sort by mtime: image2 (800) before image1 (1000)
		const imageIds = Object.values(result.folder1.images).map(image => image.id);
		assert.strictEqual(imageIds[0], "fold1_img2");
		assert.strictEqual(imageIds[1], "fold1_img1");
	});

	test("CustomSorter.sort(): sort by extension", () => {
		const obj = new TestObjects();
		const sorter = new CustomSorter();
		const result = sorter.sort(
			{"folder1": obj.folder1},
			"ext",
			true
		);

		// Should sort by extension: JPG before PNG
		const imageIds = Object.values(result.folder1.images).map(image => image.id);
		assert.strictEqual(imageIds[0], "fold1_img1"); // JPG
		assert.strictEqual(imageIds[1], "fold1_img2"); // PNG
	});
});
