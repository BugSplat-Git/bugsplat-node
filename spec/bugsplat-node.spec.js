const BugSplatNode = require('../bugsplat-node');

describe('bugsplat-node', () => {
    let bugsplatNode

    beforeEach(() => {
        bugsplatNode = new BugSplatNode('Fred', 'myNodeCrasher', '1.0.0');
        bugsplatNode._bugsplat = {
            setDefaultAppKey: jasmine.createSpy(),
            setDefaultDescription: jasmine.createSpy(),
            setDefaultEmail: jasmine.createSpy(),
            setDefaultUser: jasmine.createSpy(),
            post: jasmine.createSpy()
        };
    });

    describe('setDefaultAppKey', () => {
        it('should call bugsplat.setDefaultAppKey with appKey', () => {
            const appKey = '🐶';
            bugsplatNode.setDefaultAppKey(appKey);

            expect(bugsplatNode._bugsplat.setDefaultAppKey).toHaveBeenCalled();
        });
    });

    describe('setDefaultDescription', () => {
        it('should call bugsplat.setDefaultDescription with description', () => {
            const description = '🐶';
            bugsplatNode.setDefaultDescription(description);

            expect(bugsplatNode._bugsplat.setDefaultDescription).toHaveBeenCalled();
        });
    });

    describe('setDefaultEmail', () => {
        it('should call bugsplat.setDefaultEmail with email', () => {
            const email = '🐶';
            bugsplatNode.setDefaultEmail(email);

            expect(bugsplatNode._bugsplat.setDefaultEmail).toHaveBeenCalled();
        });
    });

    describe('setDefaultUser', () => {
        it('should call bugsplat.setDefaultUser with user', () => {
            const user = '🐶';
            bugsplatNode.setDefaultUser(user);

            expect(bugsplatNode._bugsplat.setDefaultUser).toHaveBeenCalled();
        });
    });

    describe('setDefaultAdditionalFilePaths', () => {
        it('should set value of additionalFilePaths', () => {
            const additionalPaths = ['/path/to/❤️'];
            bugsplatNode.setDefaultAdditionalFilePaths(additionalPaths);

            expect(bugsplatNode._additionalFilePaths).toEqual(additionalPaths);
        });
    });

    describe('post', () => {

        beforeEach(() => {
            bugsplatNode._console = {
                error: jasmine.createSpy()
            };
            bugsplatNode._fs = {
                existsSync: jasmine.createSpy(),
                statSync: jasmine.createSpy(),
                createReadStream: jasmine.createSpy(),
            };
            bugsplatNode._path = {
                basename: jasmine.createSpy()
            };
        });

        it('should call bugsplat.post with error and options', async () => {
            const error = new Error('🐛');
            const options = { foo: 'bar' };

            await bugsplatNode.post(error, options);

            expect(bugsplatNode._bugsplat.post).toHaveBeenCalledWith(error, {
                ...options,
                additionalFormDataParams: []
            });
        });

        it('should add additionalFilePaths to post options as form params', async () => {
            const filePath = '/path/to/❤️';
            const key = '🐶';
            const value = '🐛';
            bugsplatNode._fs.statSync.and.returnValue({ size: 0 });
            bugsplatNode._fs.existsSync.and.returnValue(true);
            bugsplatNode._fs.createReadStream.and.returnValue(value);
            bugsplatNode._path.basename.and.returnValue(key);

            bugsplatNode.setDefaultAdditionalFilePaths([filePath]);
            await bugsplatNode.post(new Error('oof'));

            expect(bugsplatNode._fs.statSync).toHaveBeenCalledWith(filePath);
            expect(bugsplatNode._bugsplat.post).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({
                additionalFormDataParams: [{
                    key,
                    value
                }]
            }));
        });

        it('should overwrite default additionalFilePaths if provided by post options', async () => {
            const defaultFilePath = '/path/to/❤️';
            const optionsFilePath = '/path/to/💕';
            const key = '🐶';
            const value = '🐛';
            bugsplatNode._fs.statSync.and.returnValue({ size: 0 });
            bugsplatNode._fs.existsSync.and.returnValue(true);
            bugsplatNode._fs.createReadStream.and.returnValue(value);
            bugsplatNode._path.basename.and.returnValue(key);

            bugsplatNode.setDefaultAdditionalFilePaths([defaultFilePath]);
            await bugsplatNode.post(new Error('oof'), { additionalFilePaths: [optionsFilePath] });

            expect(bugsplatNode._fs.statSync).not.toHaveBeenCalledWith(defaultFilePath);
            expect(bugsplatNode._fs.statSync).toHaveBeenCalledWith(optionsFilePath);
            expect(bugsplatNode._bugsplat.post).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({
                additionalFormDataParams: [{
                    key,
                    value
                }]
            }));
        });

        it('should skip adding files to post options if they cause the bundle size limit to be exceeded', async () => {
            bugsplatNode._fs.existsSync.and.returnValue(true);
            bugsplatNode._fs.statSync.and.returnValue({ size: 1000000000000 });

            await bugsplatNode.post(new Error('oof'), { additionalFilePaths: ['💪'] });

            expect(bugsplatNode._bugsplat.post).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({
                additionalFormDataParams: []
            }));
        });

        it('should log an error when a adding a file to post options if they cause the bundle size limit to be exceeded', async () => {
            const filePath = '💪';
            bugsplatNode._fs.existsSync.and.returnValue(true);
            bugsplatNode._fs.statSync.and.returnValue({ size: 1000000000000 });

            await bugsplatNode.post(new Error('oof'), { additionalFilePaths: [filePath] });

            expect(bugsplatNode._console.error).toHaveBeenCalledWith(`BugSplat upload limit of 1MB exceeded, skipping file: ${filePath}`);
        });

        it('should log an error when specified file does not exist at path', async () => {
            const filePath = '👻';
            bugsplatNode._fs.existsSync.and.returnValue(false);

            await bugsplatNode.post(new Error('oof'), { additionalFilePaths: [filePath] });

            expect(bugsplatNode._console.error).toHaveBeenCalledWith(`BugSplat file doesn't exist at path: ${filePath}`);
        });
    });

    describe('postAndExit', () => {
        it('should call post with error and options', async () => {
            const error = new Error('🐛');
            const options = { foo: 'bar' };
            spyOn(bugsplatNode, 'post').and.returnValue(Promise.resolve());
            bugsplatNode._process = { exit: jasmine.createSpy() };

            await bugsplatNode.postAndExit(error, options);

            expect(bugsplatNode.post).toHaveBeenCalledWith(error, options);
        });

        it('should call process.exit with return code 1', async () => {
            const error = new Error('🐛');
            const options = { foo: 'bar' };
            spyOn(bugsplatNode, 'post').and.returnValue(Promise.resolve());
            bugsplatNode._process = { exit: jasmine.createSpy() };

            await bugsplatNode.postAndExit(error, options);

            expect(bugsplatNode._process.exit).toHaveBeenCalledWith(1);
        });
    });
});
