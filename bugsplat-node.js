const BugSplat = require('bugsplat');
const fs = require('fs');
const path = require('path');

module.exports = function (database, appName, appVersion) {
    this._bugsplat = new BugSplat(database, appName, appVersion);
    this._fs = fs;
    this._path = path;
    this._process = process;
    this._console = console;

    this._additionalFilePaths = [];

    this.setDefaultAdditionalFilePaths = (filePaths) => {
        this._additionalFilePaths = filePaths;
    }

    this.setDefaultAppKey = (appKey) => {
        this._bugsplat.setDefaultAppKey(appKey);
    }

    this.setDefaultDescription = (description) => {
        this._bugsplat.setDefaultDescription(description);
    }

    this.setDefaultEmail = (email) => {
        this._bugsplat.setDefaultEmail(email);
    }

    this.setDefaultUser = (user) => {
        this._bugsplat.setDefaultUser(user);
    }

    this.post = async (errorToPost, options) => {
        options = options || {};

        const additionalFilePaths = options.additionalFilePaths || this._additionalFilePaths;
        const additionalFormDataParams = this._createAdditionalFilesFormParams(additionalFilePaths);
        delete options.additionalFilePaths;
        
        return this._bugsplat.post(errorToPost, {
            ...options,
            additionalFormDataParams
        });
    }

    this.postAndExit = async (errorToPost, options) => {
        return this.post(errorToPost, options).then(() => this._process.exit(1));
    }

    this._createAdditionalFilesFormParams = (additionalFilePaths) => {
        const params = [];

        let totalZipSize = 0;
        for (var i = 0; i < additionalFilePaths.length; i++) {
            const filePath = additionalFilePaths[i];
            if (this._fs.existsSync(filePath)) {
                const fileSize = this._fs.statSync(filePath).size;
                totalZipSize = totalZipSize + fileSize;
                if (totalZipSize <= 1048576) {
                    const fileName = this._path.basename(filePath);
                    const fileContents = this._fs.createReadStream(filePath);
                    params.push({ 
                        key: fileName,
                        value: fileContents
                    });
                } else {
                    this._console.error(`BugSplat upload limit of 1MB exceeded, skipping file: ${filePath}`);
                    totalZipSize = totalZipSize - fileSize;
                }
            } else {
                this._console.error(`BugSplat file doesn't exist at path: ${filePath}`);
            }
        }

        return params;
    }
};