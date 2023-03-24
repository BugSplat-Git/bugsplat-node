import { BugSplat, FormDataParam } from 'bugsplat';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { BugSplatNodeOptions } from './bugsplat-node-options';

export class BugSplatNode extends BugSplat {
    private _fs = fs;
    private _path = path;
    private _process = process;
    private _console = console;

    private _additionalFilePaths: Array<string> = [];

    constructor(database: string, application: string, version: string) {
        super(database, application, version);
    }

    setDefaultAdditionalFilePaths(additionalFilePaths: Array<string>): void {
        this._additionalFilePaths = additionalFilePaths;
    }

    async post(errorToPost: Error, options?: BugSplatNodeOptions) {
        options = options || {};

        const additionalFilePaths = options.additionalFilePaths || this._additionalFilePaths;
        const additionalFormDataParams = await this.createAdditionalFilesFormParams(additionalFilePaths);
        delete options.additionalFilePaths;

        return super.post(errorToPost, {
            ...options,
            additionalFormDataParams
        });
    }

    async postAndExit (errorToPost: Error, options?: BugSplatNodeOptions) {
        return this.post(errorToPost, options).then(() => this._process.exit(1));
    }

    private async createAdditionalFilesFormParams(additionalFilePaths: Array<string>): Promise<Array<FormDataParam>> {
        const params: Array<any> = [];

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
                    params.push({
                        key: fileName,
                        value: new Blob([fileContents])
                    });
                } else {
                    this._console.error(`BugSplat upload limit of 10MB exceeded, skipping file: ${filePath}`);
                    totalZipSize = totalZipSize - fileSize;
                }
            } else {
                this._console.error(`BugSplat file doesn't exist at path: ${filePath}`);
            }
        }

        return params;
    }
}
