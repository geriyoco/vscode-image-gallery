# Change Log

## [1.2.2] - 2026-01-18
### Added
- Viewer: Images now auto-refresh when the file changes.

## [1.2.1] - 2022-09-28
### Fixed
- Supported file extensions are now consistent between [`package.json`](package.json) and [`src/utils.ts`](src/utils.ts).

## [1.2.0] - 2022-09-21
### Added
- Telemetry for feature insights. We strive to be transparent at what we collect. See [`telemetry.json`](telemetry.json) for all the events we collect. Following the [Microsoft Privacy Statement](https://privacy.microsoft.com/en-us/privacystatement), we do not collect any Personally Identifiable Information (PII). Check out the open-source repository at [here](https://github.com/geriyoco/vscode-image-gallery) to inspect the code. You can always opt-out of telemetry by setting `geriyocoImageGallery.isTelemetryEnabled` to `false` in your VS Code settings. Visit [here](https://code.visualstudio.com/docs/getstarted/telemetry) to learn more about VS Code telemetry.

### Fixed
- Image sort preference was not respected when file watcher is involved, e.g. after an image is added, deleted, or modified.

## [1.0.0] - 2022-09-12
### Added
- Support sorting by name, type, size, created time, and modified time
- Support supporting in both ascending order and descending order
- Folders are only sorted by name in ascending order

### Changed
- Separated the "collapse all" and "expand all" buttons
- Dropped support for web extension to improve performance (web support will be added back in the future)

### Fixed
- Icons are now consistent with the VS Code's codicons.
- Gallery view is automatically updated when an image is added, modified, or deleted. However, when changes are made to the folder structure, the user needs to manually refresh the view by reopening the gallery.

## [0.4.1] - 2022-08-01
### Fixed
- Buttons to expand/collapse all sub-folders were not showing up (temporary fix without using [@vscode/codicons](https://github.com/microsoft/vscode-codicons))

## [0.4.0] - 2022-07-30
### Added
- Buttons to expand/collapse all sub-folders in the gallery view
- Tooltip containing metadata appears with a delay when hovering over an image in the gallery view

### Changed
- Clicking (both single and double) an image on the gallery will focus the image on the Explorer side bar (see [here](https://github.com/geriyoco/vscode-image-gallery/pull/75#issue-1284403392)); a separate viewer will still be opened up

## [0.2.7] - 2022-06-26
### Changed
- Single clicking an image in Gallery view opens up the image in Preview Mode
- Double clicking an image in Gallery view opens up the image (not in Preview Mode)

### Fixed
- Files within sub-folders were not being sorted correctly

## [0.2.6] - 2022-06-23
### Added
- Gallery supports collapsible sub-folders
- Sort sub-folders and files by alphanumeric order

## [0.2.5] - 2022-05-14
### Added
- Sort filenames by alphanumeric order by default
- Added additional configuration for sorting in settings

## [0.2.4] - 2022-05-12

## [0.2.3] - 2022-05-01
### Added
- Display filename as tab title in the viewer
- Display filename underneath each image in gallery

## [0.2.2] - 2022-04-27
### Added
- Content persistence when switching between tabs

## [0.2.1] - 2022-04-20
### Added
- Auto refresh

## [0.2.0] - 2022-04-18
### Added
- Image viewer can be opened by left clicking images on the side bar (File Explorer)
- Print message when no image is found in the selected folder
- Support for web extension

### Changed
- Zoom center is set to cursor position
- Tab contents are now persistent until closed

## _[0.1.0 prerelease]_ - 2022-04-17
### Added
- Image viewer can be opened by left clicking images on the side bar (File Explorer)
- Print message when no image is found in the selected folder
- Support for web extension

### Changed
- Zoom center is set to cursor position
- Tab contents are now persistent until closed

## [0.0.2] - 2022-04-11
### Added
- Gallery can be opened by right clicking folders in the Explorer sidebar

## [0.0.1] - 2022-04-10
- Initial release
