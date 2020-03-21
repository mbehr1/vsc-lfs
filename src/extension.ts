/* --------------------
 * Copyright (C) Matthias Behr, 2020
 * 
 * This extension provides a temporary solution until vscode issue #27100, feature request #31078
 * is changed/implemented.
 * 
 * Missing features:
 * [ ] support watch for changing files
 * [ ] remove readonly restriction
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
// todo const TelemetryReporter = require('vscode-extension-telemetry');

export function activate(context: vscode.ExtensionContext) {
	console.log('vsc-lfs.activated. Use "open large file" command to open a large file :-)');

	const lfsP = new LFSProvider();
	context.subscriptions.push(vscode.workspace.registerFileSystemProvider('lfs', lfsP, { isReadonly: true, isCaseSensitive: true }));

	context.subscriptions.push(vscode.commands.registerCommand('extension.lfsOpenFile', async () => {
		return vscode.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, filters: { 'Large files': <Array<string>>(vscode.workspace.getConfiguration().get("vsc-lfs.fileFilters")) }, openLabel: 'Select large file to open...' }).then(
			async (uris: vscode.Uri[] | undefined) => {
				if (uris) {
					uris.forEach((uri) => {
						console.log(`open large file got URI=${uri.toString()}`);
						let lfsUri = uri.with({ scheme: 'lfs' });
						vscode.workspace.openTextDocument(lfsUri).then((value) => { vscode.window.showTextDocument(value, { preview: false }); });
					});
				}
			}
		);
	}));

}

class LFSProvider implements vscode.FileSystemProvider {

	static limitedSize = 1024 * 1024; // limit to 1MB on first read.
	static reReadTimeout: number = 1000; // 1s
	private _uriMap: Map<string, { limitSize: boolean, fileBuffer?: Buffer }> = new Map<string, { limitSize: boolean, fileBuffer?: Buffer }>();

	stat(uri: vscode.Uri): vscode.FileStat {
		const fileUri = uri.with({ scheme: 'file' });

		if (!this._uriMap.has(fileUri.toString())) {
			this._uriMap.set(fileUri.toString(), { limitSize: true });
		}

		const limitSize = this._uriMap.get(fileUri.toString())?.limitSize;

		// console.log(`vsc-lfs.stat(uri=${uri.toString()})... fileUri=${fileUri.toString()} _limitSize=${limitSize}`);

		const realStat = fs.statSync(uri.fsPath);
		let fileStat: vscode.FileStat = { ctime: realStat.ctime.valueOf(), mtime: realStat.mtime.valueOf(), size: limitSize ? LFSProvider.limitedSize : realStat.size, type: realStat.isFile ? (vscode.FileType.File) : (realStat.isDirectory ? vscode.FileType.Directory : vscode.FileType.Unknown) };
		// console.log(` stat returning size=${fileStat.size}/${realStat.size}`);
		return fileStat;
	}

	readFile(uri: vscode.Uri): Uint8Array {
		const fileUri = uri.with({ scheme: 'file' });
		if (!this._uriMap.has(fileUri.toString())) {
			this._uriMap.set(fileUri.toString(), { limitSize: true });
		}
		let curSet = this._uriMap.get(fileUri.toString());
		if (!curSet) {
			throw vscode.FileSystemError.Unavailable();
		}

		console.log(`vsc-lfs.readFile(uri=${uri.toString()})...fileUri=${fileUri.toString()} _limitSize=${curSet.limitSize}`);

		if (!curSet.fileBuffer) {
			console.log(` largeFile reading ${fileUri.fsPath}`);
			curSet.fileBuffer = fs.readFileSync(fileUri.fsPath);
			if (!curSet.fileBuffer) {
				throw vscode.FileSystemError.FileNotFound();
			}
		}

		if (curSet.limitSize && curSet.fileBuffer && (curSet.fileBuffer.length <= LFSProvider.limitedSize)) {
			// the file is already smaller than our limit
			curSet.limitSize = false;
		}

		if (curSet.limitSize) {
			setTimeout(() => {
				//console.log(` readFile triggering re-read...`);
				let curSet = this._uriMap.get(fileUri.toString());
				if (curSet) {
					curSet.limitSize = false;
					this._uriMap.set(fileUri.toString(), curSet);
				}
				this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri: uri }]);
			}, LFSProvider.reReadTimeout);

			return curSet.fileBuffer.slice(0, 0 + LFSProvider.limitedSize);
		} else {
			let toRet = curSet.fileBuffer;
			curSet.fileBuffer = undefined;
			return toRet;
		}
	}

	private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
	readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

	watch(uri: vscode.Uri): vscode.Disposable {
		console.log(`vsc-lfs.watch(uri=${uri.toString()}...`);
		return new vscode.Disposable(() => {
			console.log(`vsc-lfs.watch.Dispose ${uri}`);
			const fileUri = uri.with({ scheme: 'file' });
			let curSet = this._uriMap.get(fileUri.toString());
			if (curSet) {
				// we could delete the key as well
				curSet.limitSize = true;
				curSet.fileBuffer = undefined;
				this._uriMap.set(fileUri.toString(), curSet);
			}
		});
	}

	readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
		console.log(`vsc-lfs.readDirectory(uri=${uri.toString()}...`);
		return [];
	}

	writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): void {
		console.log(`vsc-lfs.writeFile(uri=${uri.toString()}...`);
		throw vscode.FileSystemError.NoPermissions();
	}

	rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {
		console.log(`vsc-lfs.rename(oldUri=${oldUri.toString()}...`);
		throw vscode.FileSystemError.NoPermissions();
	}

	delete(uri: vscode.Uri): void {
		console.log(`vsc-lfs.delete(uri=${uri.toString()}...`);
		throw vscode.FileSystemError.NoPermissions();
	}

	createDirectory(uri: vscode.Uri): void {
		console.log(`vsc-lfs.createDirectory(uri=${uri.toString()}...`);
		throw vscode.FileSystemError.NoPermissions();
	}

}