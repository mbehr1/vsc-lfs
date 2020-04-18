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
import TelemetryReporter from 'vscode-extension-telemetry';

let reporter: TelemetryReporter;

export function activate(context: vscode.ExtensionContext) {
	console.log('vsc-lfs.activated. Use "open large file" command to open a large file :-)');

	const extensionId = 'mbehr1.vsc-lfs';
	const extension = vscode.extensions.getExtension(extensionId);

	if (extension) {
		const extensionVersion = extension.packageJSON.extensionVersion;

		// the aik is not really sec_ret. but lets avoid bo_ts finding it too easy:
		const strKE = 'ZjJlMDA4NTQtNmU5NC00ZDVlLTkxNDAtOGFiNmIzNTllODBi';
		const strK = Buffer.from(strKE, "base64").toString();
		reporter = new TelemetryReporter(extensionId, extensionVersion, strK);
		context.subscriptions.push(reporter);
		reporter?.sendTelemetryEvent('activate');
	} else {
		console.log("vsc-lfs: not found as extension!");
	}

	const lfsP = new LFSProvider();
	context.subscriptions.push(vscode.workspace.registerFileSystemProvider('lfs', lfsP, { isReadonly: true, isCaseSensitive: true }));

	context.subscriptions.push(vscode.commands.registerCommand('extension.lfsOpenFile', async () => {
		return vscode.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, filters: { 'Large files': <Array<string>>(vscode.workspace.getConfiguration().get("vsc-lfs.fileFilters")) }, openLabel: 'Select large file to open...' }).then(
			async (uris: vscode.Uri[] | undefined) => {
				if (uris) {
					uris.forEach((uri) => {
						console.log(`open large file got URI=${uri.toString()}`);
						let lfsUri = uri.with({ scheme: 'lfs' });
						lfsP.markLimitSize(lfsUri);
						vscode.workspace.openTextDocument(lfsUri).then((value) => { vscode.window.showTextDocument(value, { preview: false }); });
					});
				}
			}
		);
	}));

	context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((doc) => {
		lfsP.onDidCloseTextDocument(doc.uri);
	}));

}

export class LFSProvider implements vscode.FileSystemProvider { // export only for test access?

	limitedSize: number = 1024 * 1024; // limit to 1MB on first read.
	reReadTimeout: number = vscode.workspace.getConfiguration().get<number>('vsc-lfs.reReadTimeout') ?
		<number>(vscode.workspace.getConfiguration().get<number>('vsc-lfs.reReadTimeout')) : 5000; // 5s default
	private _uriMap: Map<string, { limitSize: boolean, fileBuffer?: Buffer }> = new Map<string, { limitSize: boolean, fileBuffer?: Buffer }>();

	markLimitSize(uri: vscode.Uri, limitSize = true) {
		if (!this._uriMap.has(uri.toString())) {
			console.log(`vsc-lfs.markLimitSize(uri=${uri.toString()})... limitSize=${limitSize}`);
			this._uriMap.set(uri.toString(), { limitSize: limitSize });
		} else {
			let curSet = this._uriMap.get(uri.toString());
			if (curSet) {
				curSet.limitSize = limitSize;
				this._uriMap.set(uri.toString(), curSet);
			}
		}
	}

	stat(uri: vscode.Uri): vscode.FileStat {

		if (!this._uriMap.has(uri.toString())) {
			this._uriMap.set(uri.toString(), { limitSize: true });
		}

		const limitSize = this._uriMap.get(uri.toString())?.limitSize;

		// console.log(`vsc-lfs.stat(uri=${uri.toString()})... _limitSize=${limitSize}`);
		const fileUri = uri.with({ scheme: 'file' });
		const realStat = fs.statSync(fileUri.fsPath);
		let fileStat: vscode.FileStat = { ctime: realStat.ctime.valueOf(), mtime: realStat.mtime.valueOf(), size: (limitSize && realStat.size > this.limitedSize) ? this.limitedSize : realStat.size, type: realStat.isFile() ? (vscode.FileType.File) : (realStat.isDirectory() ? vscode.FileType.Directory : vscode.FileType.Unknown) };
		// console.log(` stat returning size=${fileStat.size}/${realStat.size}`);
		return fileStat;
	}

	readFile(uri: vscode.Uri): Uint8Array {
		if (!this._uriMap.has(uri.toString())) {
			this._uriMap.set(uri.toString(), { limitSize: true });
		}
		let curSet = this._uriMap.get(uri.toString());
		if (!curSet) {
			throw vscode.FileSystemError.Unavailable();
		}

		console.log(`vsc-lfs.readFile(uri=${uri.toString()})... _limitSize=${curSet.limitSize}`);

		if (!curSet.fileBuffer) {
			const fileUri = uri.with({ scheme: 'file' });
			console.log(` largeFile reading ${fileUri.fsPath}`);
			curSet.fileBuffer = fs.readFileSync(fileUri.fsPath);
			if (!curSet.fileBuffer) {
				throw vscode.FileSystemError.FileNotFound();
			}
			reporter?.sendTelemetryEvent('open large file', undefined, { 'fileSize': curSet.fileBuffer.length });
		}

		if (curSet.limitSize && curSet.fileBuffer && (curSet.fileBuffer.length <= this.limitedSize)) {
			// the file is already smaller than our limit
			curSet.limitSize = false;
		}

		if (curSet.limitSize) {
			setTimeout(() => {
				//console.log(` readFile triggering re-read...`);
				let curSet = this._uriMap.get(uri.toString());
				if (curSet) {
					curSet.limitSize = false;
					this._uriMap.set(uri.toString(), curSet);
				}
				this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri: uri }]);
			}, this.reReadTimeout);

			return curSet.fileBuffer.slice(0, 0 + this.limitedSize);
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
			let curSet = this._uriMap.get(uri.toString());
			if (curSet) {
				// on changing to a different editor the watch dispose is called already.
				// let's try to optimize that.
				// we don't delete the key here as we don't know whether the file is still open.
				//curSet.limitSize = true;
				curSet.fileBuffer = undefined;
				this._uriMap.set(uri.toString(), curSet);
			}
		});
	}

	onDidCloseTextDocument(uri: vscode.Uri) {
		// console.log(`vsc-lfs onDidCloseTextDocument(${uri.toString()})...`);
		let curSet = this._uriMap.get(uri.toString());
		if (curSet) {
			console.log(` onDidCloseTextDocument(${uri.toString()}) closing internally.`);
			curSet.limitSize = true;
			curSet.fileBuffer = undefined;
			this._uriMap.set(uri.toString(), curSet);
		}
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
