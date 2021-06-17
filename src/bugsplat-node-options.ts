import { BugSplatOptions } from "bugsplat";

export interface BugSplatNodeOptions extends BugSplatOptions {
    additionalFilePaths?: Array<string>;
}