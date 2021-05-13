# Change Log for 'vsc-lfs':

## [1.4.0](https://github.com/mbehr1/vsc-lfs/compare/v1.3.6...v1.4.0) (2021-05-13)


### Features

* limit support of untrusted workspaces ([14f71c8](https://github.com/mbehr1/vsc-lfs/commit/14f71c89cb29ea314cb9ee32af7cb371737ac96d))

### [1.3.6](https://github.com/mbehr1/vsc-lfs/compare/v1.3.5...v1.3.6) (2021-02-06)


### Bug Fixes

* issue links in readme ([04467a2](https://github.com/mbehr1/vsc-lfs/commit/04467a2aa1eab7ef07f7e2ab8f8970209cf2eabd))

### [1.3.5](https://github.com/mbehr1/vsc-lfs/compare/v1.3.4...v1.3.5) (2020-12-27)

### [1.3.4](https://github.com/mbehr1/vsc-lfs/compare/v1.3.3...v1.3.4) (2020-12-27)


### Bug Fixes

* **changelog:** changelogs not updated ([a010dcb](https://github.com/mbehr1/vsc-lfs/commit/a010dcb5fd73cd6ef9ef025f689e65b7b24371e8))

### [1.3.3]
* **CI/build:** add automatic generation of vsix package.

### [1.3.2](https://github.com/mbehr1/vsc-lfs/compare/v1.3.1...v1.3.2) (2020-12-27)


### Bug Fixes

* **copyright:** update copyright for 2021 ([7352d79](https://github.com/mbehr1/vsc-lfs/commit/7352d7908cee19e66afee78f1190bf3d7a7d57d5))

### [1.3.1]
- updated README example

### [1.3.0]
- added *replacements* configuration option for search/replace feature to shrink the file content on loading. This can be used to e.g. replace unneeded content in large files before loading.

### [1.2.1]
- update dependencies after github security advisory
- fix extensionVersion

### [1.2.0]
- changed watch dispose behaviour to reduce number of re-loads on changing active document.
- implemented readDirectory so that breadcrumb navigation is working.

### [1.1.5]
- fixed a bug with wrongly detected directories as files.

### [1.1.4]
- fixed a bug with small files returning wrong size on stat.

### [1.1.3]
- add support for automatic reopen at startup

### [1.1.2]
- Set default re-read timeout to 5s.

### [1.1.1]
- Added config for re-read timeout: `vsc-lfs.reReadTimeout`.

### [1.1.0]

- Added telemetry using vscode-extension-telemetry with events: 'activate' and 'open large file' (measurement: fileSize). The telemetry is following the user setting: telemetry.enableTelemetry.
### [1.0.2]
- Initial release
