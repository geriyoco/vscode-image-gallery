import vscode from 'vscode';
import { assert } from 'chai';

import CustomSorter from '../..//gallery/sorter';
// import * as utils from '../../utils';
import { TFolder } from 'custom_typings';

class TestObjects {
	folder1: TFolder = {
		id: "folder1",
		path: "/home/user/folder1",
		images: {
			"image1": {
				id: "fold1_img1",
				uri: vscode.Uri.file("/home/user/folder1/image1.jpg"),
				ext: "JPG",
				size: 100,
				mtime: 1000,
				ctime: 1000,
				status: "",
			},
			"image2": {
				id: "fold1_img2",
				uri: vscode.Uri.file("/home/user/folder1/image2.png"),
				ext: "PNG",
				size: 200,
				mtime: 800,
				ctime: 1200,
				status: "",
			},
		}
	};

	folder2: TFolder = {
		id: "folder2",
		path: "/home/user/folder2",
		images: {
			"image3": {
				id: "fold2_img3",
				uri: vscode.Uri.file("/home/user/folder2/image3.jpeg"),
				ext: "JPEG",
				size: 300,
				mtime: 1500,
				ctime: 1100,
				status: "",
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

	// test("CustomSorter.sort(): sort by name", () => {
	// 	const obj = new TestObjects();
	// 	const sorter = new CustomSorter();
	// 	const result = sorter.sort(
	// 		{"folder1": obj.folder1, "folder2": obj.folder2},
	// 		"name",
	// 		true, // ascending
	// 	);

	// 	assert.strictEqual(
	// 		Object.values(result.folder1.images).map(image => image.id).join(","),
	// 		"fold1_img1,fold1_img2"
	// 	);
	// });
});
