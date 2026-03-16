import { describe, it, expect } from 'vitest';
import { BugSplatNode } from '../../src/index';
import { BugSplatApiClient, Environment, CrashApiClient } from '@bugsplat/js-api-client';
const username = 'fred@bugsplat.com';
const host = 'https://app.bugsplat.com';

describe('BugSplatNode', () => {
    it('should post a crash report with all provided information', async () => {
        const password = process.env.FRED_PASSWORD ?? '';
        if (!password) {
            throw new Error('Please set FRED_PASSWORD environment variable');
        }

        const database = 'fred';
        const appName = 'my-node-crasher';
        const appVersion = '1.2.3.4';
        const error = new Error('BugSplat!!');
        const appKey = 'Key!';
        const user = 'User!';
        const email = 'fred@bedrock.com';
        const description = 'Description!';
        const additionalFile = './spec/e2e/files/additionalFile.txt';
        const bugsplat = new BugSplatNode(database, appName, appVersion);
        bugsplat.setDefaultAppKey(appKey);
        bugsplat.setDefaultUser(user);
        bugsplat.setDefaultEmail(email);
        bugsplat.setDefaultDescription(description);
        bugsplat.setDefaultAdditionalFilePaths([additionalFile]);
        const result = await bugsplat.post(error);

        if (result.error) {
            throw result.error;
        }

        const expectedCrashId = result.response.crash_id;
        const client = new BugSplatApiClient(host, Environment.Node);
        await client.login(username, password);
        const crashApiClient = new CrashApiClient(client);
        const crashData = await crashApiClient.getCrashById(database, expectedCrashId);

        expect(crashData['appName']).toEqual(appName);
        expect(crashData['appVersion']).toEqual(appVersion);
        expect(crashData['appKey']).toEqual(appKey);
        expect(crashData['description']).toEqual(description);
        expect(crashData['user']).toBeTruthy() // Fred has PII obfuscated so the best we can do here is to check if truthy
        expect(crashData['email']).toBeTruthy()  // Fred has PII obfuscated so the best we can do here is to check if truthy
    }, 30000);

    it('should post user feedback with all provided information', async () => {
        const database = 'fred';
        const appName = 'my-node-crasher';
        const appVersion = '1.2.3.4';
        const title = 'Login button broken';
        const user = 'User!';
        const email = 'fred@bedrock.com';
        const description = 'Nothing happens when I tap it';
        const additionalFile = './spec/e2e/files/additionalFile.txt';
        const bugsplat = new BugSplatNode(database, appName, appVersion);
        bugsplat.setDefaultUser(user);
        bugsplat.setDefaultEmail(email);

        const result = await bugsplat.postFeedback(title, {
            description,
            additionalFilePaths: [additionalFile],
        });

        expect(result.error).toBeNull();
        expect(result.response.status).toEqual('success');
        expect(result.response.crash_id).toBeGreaterThan(0);
    }, 30000);
});
