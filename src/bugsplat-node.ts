import { BugSplat, BugSplatAttachment } from 'bugsplat';
import fs from 'fs';
import path from 'path';
import { BugSplatNodeOptions } from './bugsplat-node-options';

export class BugSplatNode {
    private _bugsplat: BugSplat;
    private _fs = fs;
    private _path = path;
    private _process = process;
    private _console = console;

    private _additionalFilePaths: Array<string> = [];

    get database(): string { return this._bugsplat.database; }
    get application(): string { return this._bugsplat.application; }
    get version(): string { return this._bugsplat.version; }

    constructor(database: string, application: string, version: string) {
        this._bugsplat = new BugSplat(database, application, version);
    }

    setDefaultAppKey(appKey: string): void {
        this._bugsplat.setDefaultAppKey(appKey);
    }

    setDefaultAttributes(attributes: Record<string, string>): void {
        this._bugsplat.setDefaultAttributes(attributes);
    }

    setDefaultDescription(description: string): void {
        this._bugsplat.setDefaultDescription(description);
    }

    setDefaultEmail(email: string): void {
        this._bugsplat.setDefaultEmail(email);
    }

    setDefaultUser(user: string): void {
        this._bugsplat.setDefaultUser(user);
    }

    setDefaultAdditionalFilePaths(additionalFilePaths: Array<string>): void {
        this._additionalFilePaths = additionalFilePaths;
    }

    async post(errorToPost: Error, options?: BugSplatNodeOptions) {
        options = options || {};

        const additionalFilePaths = options.additionalFilePaths || this._additionalFilePaths;
        const fileAttachments = await this.createAttachmentsFromFilePaths(additionalFilePaths);
        delete options.additionalFilePaths;

        return this._bugsplat.post(errorToPost, {
            ...options,
            attachments: [
                ...(options.attachments || []),
                ...fileAttachments,
            ],
        });
    }

    async postAndExit(errorToPost: Error, options?: BugSplatNodeOptions) {
        return this.post(errorToPost, options).then(() => this._process.exit(1));
    }

    async postFeedback(title: string, options?: BugSplatNodeOptions) {
        options = options || {};

        const additionalFilePaths = options.additionalFilePaths || [];
        const fileAttachments = await this.createAttachmentsFromFilePaths(additionalFilePaths);
        delete options.additionalFilePaths;

        return this._bugsplat.postFeedback(title, {
            ...options,
            attachments: [
                ...(options.attachments || []),
                ...fileAttachments,
            ],
        });
    }

    private async createAttachmentsFromFilePaths(additionalFilePaths: Array<string>): Promise<Array<BugSplatAttachment>> {
        const attachments: Array<BugSplatAttachment> = [];

        let totalZipSize = 0;
        for (var i = 0; i < additionalFilePaths.length; i++) {
            const filePath = additionalFilePaths[i];
            if (this._fs.existsSync(filePath)) {
                const stat = await this._fs.promises.stat(filePath);
                const fileSize = stat.size;
                totalZipSize = totalZipSize + fileSize;
                if (totalZipSize <= 10485760) {
                    const fileName = this._path.basename(filePath);
                    const fileContents = await this._fs.promises.readFile(filePath);
                    attachments.push({
                        filename: fileName,
                        data: new Blob([fileContents]),
                    });
                } else {
                    this._console.error(`BugSplat upload limit of 10MB exceeded, skipping file: ${filePath}`);
                    totalZipSize = totalZipSize - fileSize;
                }
            } else {
                this._console.error(`BugSplat file doesn't exist at path: ${filePath}`);
            }
        }

        return attachments;
    }
}
