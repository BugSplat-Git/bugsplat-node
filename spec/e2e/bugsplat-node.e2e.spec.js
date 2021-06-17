const BugSplatNode = require('../../bugsplat-node');
const { BugSplatApiClient, Environment, CrashApiClient } = require('@bugsplat/js-api-client');
const username = 'fred@bugsplat.com';
const password = process.env.FRED_PASSWORD;
const host = 'https://app.bugsplat.com';

describe('BugSplatNode', () => {
    beforeEach(() => {
        if (!password) {
            throw new Error('Please set FRED_PASSWORD environment variable');
        }
    });

    it('should post a crash report with all provided information', async () => {
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
            throw new Error(result.error);
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
});