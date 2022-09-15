import * as vscode from 'vscode';
import { TImage, TFolder } from 'custom_typings';

export default class CustomSorter {
    keys: Array<string>;
    options: Intl.CollatorOptions;
    comparator: (a: string, b: string) => number;

    constructor() {
        this.keys = [
            "localeMatcher",
            "sensitivity",
            "ignorePunctuation",
            "numeric",
            "caseFirst",
            "collation",
        ];
        this.options = this.updateOptions();
        this.comparator = this.updateComparator(this.options);
    }

    updateOptions(configName: string = "sorting.byPathOptions") {
        const config = vscode.workspace.getConfiguration(configName);
        this.options = Object.fromEntries(this.keys.map(key => [key, config.get(key)]));
        return this.options;
    }

    updateComparator(options: Intl.CollatorOptions) {
        this.comparator = (a: string, b: string) => {
            return a.localeCompare(b, undefined, options);
        };
        return this.comparator;
    }

    sort(folders: Record<string, TFolder>, valueName: string = "path", ascending: boolean = true) {
        const sortedFolders = this.getSortedFolders(folders);
        for (const [name, folder] of Object.entries(sortedFolders)) {
            sortedFolders[name].images = Object.fromEntries(
                this.getSortedImages(Object.values(folder.images), valueName, ascending)
                    .map(image => [image.id, image])
            );
        }
        return sortedFolders;
    }

    getSortedFolders(folders: Record<string, TFolder>) {
        /**
         * Sort the folders by path in ascending order.
         * "sorting.byPathOptions" has no effect on this.
         */
        return Object.fromEntries(
            Object.entries(folders).sort(
                ([, folder1], [, folder2]) => folder1.path.localeCompare(folder2.path)
            )
        );
    }

    getSortedImages(images: TImage[], valueName: string, ascending: boolean) {
        const sign = ascending ? +1 : -1;
        let comparator: (a: TImage, b: TImage) => number;
        switch (valueName) {
            case "ext":
                comparator = (a: TImage, b: TImage) => sign * this.comparator(a.ext, b.ext);
                break;
            case "size":
                comparator = (a: TImage, b: TImage) => sign * (a.size - b.size);
                break;
            case "ctime":
                comparator = (a: TImage, b: TImage) => sign * (a.ctime - b.ctime);
                break;
            case "mtime":
                comparator = (a: TImage, b: TImage) => sign * (a.mtime - b.mtime);
                break;
            default: // "path"
                comparator = (a: TImage, b: TImage) => sign * this.comparator(a.uri.path, b.uri.path);
        }
        return images.sort(comparator);
    }
}