# Large file (vsc-lfs) README

[![Version](https://vsmarketplacebadge.apphb.com/version/mbehr1.vsc-lfs.svg)](https://marketplace.visualstudio.com/items?itemName=mbehr1.vsc-lfs)

This extensions allows you to (in a sane way) work around the restriction described as vscode issue #27100 and feature request #31078.
So you can open large files (e.g. a few hundred MBs) and they get passed to the extension host / to your extensions.

**Note:** Use with care! The authors decided to impose the size restriction for a good reason. Use it only when you do really need it and not for every file. 

## Features

- open large (>5MB) files and still allow your other extensions to process it.

## Usage

Use the command "open large file..." and select the file you want in the following dialog. The dialog contains a file filter that can be customized (see settings).

## Extension Settings

This extension contributes the following settings:

* `vsc-lfs.fileFilters`: Array of strings that contain the file filters to apply for the open large file dialog. Default to ["txt", "TXT", "log", LOG"].

## Known Issues

* Currently the files are opened read-only even if they are not from the original filesystem.
* File changes are not reflected/monitored. You do need to reopen the file to see any changes.

## Contributions

Any and all test, code or feedback contributions are welcome.
Open an [issue](https://github.com/mbehr1/vsc-lfs/issues) or create a pull request to make this extension work better for all.

Donations are welcome! (Contact me for commercial use or different [license](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode)).

## Release Notes

### 1.1.0

Added telemetry using vscode-extension-telemetry with events: 'activate' and 'open large file' (measurement: fileSize).
The telemetry is following the user setting: telemetry.enableTelemetry.

### 1.0.2

Initial release with read-only and no file change monitoring restriction.
