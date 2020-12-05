# Large file (vsc-lfs) README

[![Version](https://vsmarketplacebadge.apphb.com/version/mbehr1.vsc-lfs.svg)](https://marketplace.visualstudio.com/items?itemName=mbehr1.vsc-lfs)

This extensions allows you to (in a sane way) work around the restriction described as vscode issue #27100 and feature request #31078.
So you can open large files (e.g. a few hundred MBs) and they get passed to the extension host / to your extensions.

**Note:** Use with care! The vs-code authors decided to impose the size restriction for a good reason. Use it only when you do really need it and not for every file. 

## Features

- open large (>50MB) files and still allow your other extensions to process it.
- replacement features allows to search and replace file content at opening. See below for setting `vsc-lfs.replacements`.

## Usage

Use the command "open large file..." and select the file you want in the following dialog. The dialog contains a file filter that can be customized (see settings).

## Extension Settings

This extension contributes the following settings:

* `vsc-lfs.fileFilters`: Array of strings that contain the file filters to apply for the open large file dialog. Default to ["txt", "TXT", "log", LOG"].
* `vsc-lfs.reReadTimeout`: Time after which a re-read takes place. If your file doesn't open try to increase this value. Defaults to 5s.
* `vsc-lfs.replacements`: Optional array of objects with name and filters property. Filters is a array of objects with search and replace properties. If replacements are defined at *open large file...* command you can select any of the replacements. The selected ones will be applied as search and replace line-by-line. Search and replace must not increase the file size but the intention is to shrink the file. search is a javascript regular expression and replace can contain special replacement patterns like *$&* or *$n*. For details see [Specifying a string as a parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter) E.g.
```
[{
  "name": "shorten line and date",
  "filters": [
    {
      "search": "line: (\\d*)$", // regex to search lines ending with 'line: <number>'. Capturing the number.
      "replace": "l:$1" // replace with l:<number>
    },
    { // replace all ' date:' with ' d:'
      "search": " date:",
      "replace": " d:"
    }
  ]
},
{
  "name": "delete all debug lines",
  "filters": [
    "search": "^.*[DEBUG].*$", // full line with [DEBUG]
    "replace": "" // replace with empty line
  ]
}]
```
**Note:**  take care to escape \ properly in json as \\\\.

**Note:**  currently the search/replace is applied line by line.

## Known Issues

* Currently the files are opened read-only even if they are not from the original filesystem.

## Contributions

Any and all test, code or feedback contributions are welcome.
Open an [issue](https://github.com/mbehr1/vsc-lfs/issues) or create a pull request to make this extension work better for all.

[![Donations](https://www.paypalobjects.com/en_US/DK/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=2ZNMJP5P43QQN&source=url) Donations are welcome! (Contact me for commercial use or different [license](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode)).

## Planned features

* Add *autoApplyIf* option to replacements for e.g. above a certain file size or file name patterns.
* Remove readonly restriction.
* Investigate: seems like file changes are already supported. VS Code seems to understand our uri format and triggers a readFile on file change.
  Support watch for removing/deleted files.
* Add debouncing / delayed updates features to limit the amount of file changes reflected to extensions.

## Release Notes

See [Changelog](./CHANGELOG.md)
