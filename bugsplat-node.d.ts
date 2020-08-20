export = BugSplatNode;

declare module "bugsplat-node" {
    export = BugSplatNode;
}

declare class BugSplatNode {
    constructor(database: string, appName: string, appVersion: string);
    setDefaultAdditionalFilePaths(filePaths: Array<string>): void;
    setDefaultAppKey(appKey: string): void;
    setDefaultDescription(description: string): void;
    setDefaultEmail(email: string): void;
    setDefaultUser(user: string): void;
    post(errorToPost: Error, options?: BugSplatNodeOptions): Promise<BugSplatNodeResponse>;
    postAndExit(errorToPost: Error, options?: BugSplatNodeOptions): Promise<void>;
}

interface BugSplatNodeOptions {
    additionalFilePaths?: Array<string>;
    appKey?: string;
    description?:  string;
    email?: string;
    user?: string;
}

interface BugSplatNodeResponse {
    error?: Error;
    response?: any;
    original: Error;
}