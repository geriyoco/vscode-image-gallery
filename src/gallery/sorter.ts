import * as vscode from 'vscode';
import { TImage, TFolder } from 'custom_typings';

export default class CustomSorter {
    sortType: Array<string>;
    comparator: (a: string, b: string) => number;

    private initComparator(configName: string = "sorting.byPathOptions") {
        const config = vscode.workspace.getConfiguration(configName);
        const options = Object.fromEntries(this.sortType.map(key => [key, config.get(key)]));
        return (a: string, b: string) => {
            return a.localeCompare(b, undefined, options);
        };
    }

    constructor() {
        this.sortType = [
            "localeMatcher",
            "sensitivity",
            "ignorePunctuation",
            "numeric",
            "caseFirst",
            "collation",
        ];
        this.comparator = this.initComparator();
    }


    public sort(folders: Record<string, TFolder>, valueName: string = "name", ascending: boolean = true) {
        const sortedFolders = this.getSortedFolders(folders);
        for (const [name, folder] of Object.entries(sortedFolders)) {
            sortedFolders[name].images = Object.fromEntries(
                this.getSortedImages(Object.values(folder.images), valueName, ascending)
                    .map(image => [image.id, image])
            );
        }
        return sortedFolders;
    }

    private getSortedFolders(folders: Record<string, TFolder>) {
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

    private getSortedImages(images: TImage[], valueName: string, ascending: boolean) {
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
            default: // "name"
                comparator = (a: TImage, b: TImage) => sign * this.comparator(a.uri.path, b.uri.path);
        }
        return images.sort(comparator);
    }
}