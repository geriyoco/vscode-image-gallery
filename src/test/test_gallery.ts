import { Workbench } from 'vscode-extension-tester';

describe('Dummy', () => {
    it('something', async() => {
        const workbench = new Workbench();
        await workbench.executeCommand('gryc.openGallery');
    });
});
