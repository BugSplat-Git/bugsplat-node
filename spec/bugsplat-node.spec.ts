import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BugSplatNode } from '../src/index';

describe('bugsplat-node', () => {
    let bugsplatNode: any;

    beforeEach(() => {
        bugsplatNode = new BugSplatNode('Fred', 'my-node-crasher', '1.0.0');
        vi.spyOn(bugsplatNode._bugsplat, 'setDefaultAppKey');
        vi.spyOn(bugsplatNode._bugsplat, 'setDefaultDescription');
        vi.spyOn(bugsplatNode._bugsplat, 'setDefaultEmail');
        vi.spyOn(bugsplatNode._bugsplat, 'setDefaultUser');
        vi.spyOn(bugsplatNode._bugsplat, 'post').mockResolvedValue(undefined);
        vi.spyOn(bugsplatNode._bugsplat, 'postFeedback').mockResolvedValue(undefined);
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
                error: vi.fn()
            };
            bugsplatNode._fs = {
                existsSync: vi.fn(),
                promises: {
                    stat: vi.fn(),
                    readFile: vi.fn(),
                }
            };
            bugsplatNode._path = {
                basename: vi.fn()
            };
        });

        it('should call bugsplat.post with error and options', async () => {
            const error = new Error('🐛');
            const options = { foo: 'bar' };

            await bugsplatNode.post(error, options);

            expect(bugsplatNode._bugsplat.post).toHaveBeenCalledWith(error, {
                ...options,
                attachments: []
            });
        });

        it('should add additionalFilePaths to post options as attachments', async () => {
            const filePath = '/path/to/❤️';
            const filename = '🐶';
            const value = '🐛';
            bugsplatNode._fs.promises.stat.mockResolvedValue({ size: 0 });
            bugsplatNode._fs.existsSync.mockReturnValue(true);
            bugsplatNode._fs.promises.readFile.mockResolvedValue(value);
            bugsplatNode._path.basename.mockReturnValue(filename);

            bugsplatNode.setDefaultAdditionalFilePaths([filePath]);
            await bugsplatNode.post(new Error('oof'));

            expect(bugsplatNode._fs.promises.stat).toHaveBeenCalledWith(filePath);
            expect(bugsplatNode._bugsplat.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    attachments: [{
                        filename,
                        data: new Blob([value])
                    }]
                })
            );
        });

        it('should overwrite default additionalFilePaths if provided by post options', async () => {
            const defaultFilePath = '/path/to/❤️';
            const optionsFilePath = '/path/to/💕';
            const filename = '🐶';
            const value = '🐛';
            bugsplatNode._fs.promises.stat.mockResolvedValue({ size: 0 });
            bugsplatNode._fs.existsSync.mockReturnValue(true);
            bugsplatNode._fs.promises.readFile.mockResolvedValue(value);
            bugsplatNode._path.basename.mockReturnValue(filename);

            bugsplatNode.setDefaultAdditionalFilePaths([defaultFilePath]);
            await bugsplatNode.post(new Error('oof'), { additionalFilePaths: [optionsFilePath] });

            expect(bugsplatNode._fs.promises.stat).not.toHaveBeenCalledWith(defaultFilePath);
            expect(bugsplatNode._fs.promises.stat).toHaveBeenCalledWith(optionsFilePath);
            expect(bugsplatNode._bugsplat.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    attachments: [{
                        filename,
                        data: new Blob([value])
                    }]
                })
            );
        });

        it('should skip adding files to post options if they cause the bundle size limit to be exceeded', async () => {
            bugsplatNode._fs.existsSync.mockReturnValue(true);
            bugsplatNode._fs.promises.stat.mockResolvedValue({ size: 1000000000000 });

            await bugsplatNode.post(new Error('oof'), { additionalFilePaths: ['💪'] });

            expect(bugsplatNode._bugsplat.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    attachments: []
                })
            );
        });

        it('should log an error when a adding a file to post options if they cause the bundle size limit to be exceeded', async () => {
            const filePath = '💪';
            bugsplatNode._fs.existsSync.mockReturnValue(true);
            bugsplatNode._fs.promises.stat.mockResolvedValue({ size: 10000000000000 });

            await bugsplatNode.post(new Error('oof'), { additionalFilePaths: [filePath] });

            expect(bugsplatNode._console.error).toHaveBeenCalledWith(`BugSplat upload limit of 10MB exceeded, skipping file: ${filePath}`);
        });

        it('should log an error when specified file does not exist at path', async () => {
            const filePath = '👻';
            bugsplatNode._fs.existsSync.mockReturnValue(false);

            await bugsplatNode.post(new Error('oof'), { additionalFilePaths: [filePath] });

            expect(bugsplatNode._console.error).toHaveBeenCalledWith(`BugSplat file doesn't exist at path: ${filePath}`);
        });
    });

    describe('postFeedback', () => {

        beforeEach(() => {
            bugsplatNode._console = {
                error: vi.fn()
            };
            bugsplatNode._fs = {
                existsSync: vi.fn(),
                promises: {
                    stat: vi.fn(),
                    readFile: vi.fn(),
                }
            };
            bugsplatNode._path = {
                basename: vi.fn()
            };
        });

        it('should call bugsplat.postFeedback with title and options', async () => {
            const title = 'feedback title';
            const options = { description: 'some feedback' };

            await bugsplatNode.postFeedback(title, options);

            expect(bugsplatNode._bugsplat.postFeedback).toHaveBeenCalledWith(title, {
                ...options,
                attachments: []
            });
        });

        it('should convert additionalFilePaths to attachments', async () => {
            const filePath = '/path/to/file';
            const filename = 'file';
            const value = 'contents';
            bugsplatNode._fs.promises.stat.mockResolvedValue({ size: 0 });
            bugsplatNode._fs.existsSync.mockReturnValue(true);
            bugsplatNode._fs.promises.readFile.mockResolvedValue(value);
            bugsplatNode._path.basename.mockReturnValue(filename);

            await bugsplatNode.postFeedback('title', { additionalFilePaths: [filePath] });

            expect(bugsplatNode._bugsplat.postFeedback).toHaveBeenCalledWith(
                'title',
                expect.objectContaining({
                    attachments: [{
                        filename,
                        data: new Blob([value])
                    }]
                })
            );
        });
    });

    describe('postAndExit', () => {
        it('should call post with error and options', async () => {
            const error = new Error('🐛');
            const options = { foo: 'bar' };
            vi.spyOn(bugsplatNode, 'post').mockResolvedValue(undefined);
            bugsplatNode._process = { exit: vi.fn() };

            await bugsplatNode.postAndExit(error, options);

            expect(bugsplatNode.post).toHaveBeenCalledWith(error, options);
        });

        it('should call process.exit with return code 1', async () => {
            const error = new Error('🐛');
            const options = { foo: 'bar' };
            vi.spyOn(bugsplatNode, 'post').mockResolvedValue(undefined);
            bugsplatNode._process = { exit: vi.fn() };

            await bugsplatNode.postAndExit(error, options);

            expect(bugsplatNode._process.exit).toHaveBeenCalledWith(1);
        });
    });
});
