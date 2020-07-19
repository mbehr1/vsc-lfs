# Change Log

All notable changes to the "vsc-lfs" extension will be documented in this file.

<!-- Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file. -->

## [1.2.1]
- update dependencies after github security advisory
- fix extensionVersion

## [1.2.0]
- changed watch dispose behaviour to reduce number of re-loads on changing active document.
- implemented readDirectory so that breadcrumb navigation is working.

## [1.1.5]
- fixed a bug with wrongly detected directories as files.

## [1.1.4]
- fixed a bug with small files returning wrong size on stat.

## [1.1.3]
- add support for automatic reopen at startup

## [1.1.2]
- Set default re-read timeout to 5s.

## [1.1.1]
- Added config for re-read timeout: `vsc-lfs.reReadTimeout`.

## [1.1.0]

- Added telemetry using vscode-extension-telemetry with events: 'activate' and 'open large file' (measurement: fileSize). The telemetry is following the user setting: telemetry.enableTelemetry.
## [1.0.2]
- Initial release