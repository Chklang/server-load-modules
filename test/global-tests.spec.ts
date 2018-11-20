import * as fs from 'fs-extra';
import * as path from 'path';
import { expect } from 'chai';
import 'mocha';
import { loadModules, EGlobal } from '../src';

declare const global: {
    keyForTests: string;
};

describe('When i run process', () => {
    const basePathModule = path.resolve(__dirname, '../node_modules/fake-module-for-tests');

    beforeEach(() => {
        fs.removeSync(basePathModule);
    })
    afterEach(() => {
        fs.removeSync(basePathModule);
    });

    it("Modules are loaded", () => {
        //Create a fake module into node_modules
        fs.mkdirpSync(basePathModule);
        fs.writeFileSync(basePathModule + path.sep + 'package.json', JSON.stringify({
            name: 'fake-module-for-tests',
            version: '1.0.0',
            loadModuleTester: {
                paths: [
                    './lib'
                ]
            }
        }, null, 4));
        fs.mkdirpSync(basePathModule + path.sep + 'lib');
        fs.writeFileSync(basePathModule + path.sep + 'lib/fake.js', 'global.keyForTests = "myKey";');
        expect(global.keyForTests).to.equal(undefined, 'Check if global key was defined before load');
        return loadModules({
            baseFile: 'package.json',
            global: EGlobal.OPTIONAL,
            propertyDetection: ['loadModuleTester', 'paths']
        }).then(() => {
            expect(global.keyForTests).to.equal('myKey', 'Check if global key was defined after load');
        });
    });
});