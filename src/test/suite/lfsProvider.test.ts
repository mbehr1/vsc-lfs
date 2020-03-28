import * as assert from 'assert';

import * as vscode from 'vscode';
import * as myExtension from '../../extension';

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

suite('LFSProvider class Test Suite', () => {
    vscode.window.showInformationMessage('Start all LFSProvider class tests');
    let lfsP: myExtension.LFSProvider = new myExtension.LFSProvider();
    lfsP.limitedSize = 10;
    lfsP.reReadTimeout = 50; // 0.05s for test

    test('first stat limited in size', async () => {
        console.log(`cwd=${__dirname}`);
        const smallFileUri = vscode.Uri.parse(`lfs:${__dirname.replace("out/", "src/")}/../smallFile.txt`);
        // first one should be limited in size
        assert.equal(10, lfsP.stat(smallFileUri).size);
        // next ones as well until readFile happens
        assert.equal(10, lfsP.stat(smallFileUri).size);
        assert.equal(10, lfsP.readFile(smallFileUri).length);
        // wait for reread...
        await sleep(60);
        // now full size:
        assert.equal(60, lfsP.stat(smallFileUri).size);
        assert.equal(60, lfsP.readFile(smallFileUri).length);
    });

    test('access not existing file', () => {
        const uri = vscode.Uri.parse("lfs:/nonExistitingFile.txt");
        try {
            lfsP.stat(uri);
            assert.fail("Expected an error");
        } catch (err) {
        };

        assert.throws(() => {
            lfsP.stat(uri);
        }, Error, "no error thrown");
    });
});
