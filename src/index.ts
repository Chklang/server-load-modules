import * as child_process from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as autoload from 'auto-load';
import * as Logger from '@log4js-universal/logger';

const LOGGER = Logger.LoggerFactory.getLogger('server-load-modules.load-modules');

export function loadModules(params: ILoadParams): Promise<void> {
    params.arbitraryAdd = params.arbitraryAdd || [];
    params.global = params.global || EGlobal.OPTIONAL;
    params.baseFile = params.baseFile || 'package.json';
    params.basePath = params.basePath || './';
    params.propertyDetection = params.propertyDetection || [];
    params.onDetection = params.onDetection || ((e: any) => {
        return Promise.resolve(e);
    });

    params.arbitraryAdd.forEach(e => autoload.default(e));

    // Get node_module folders
    const nodeModuleFolders: string[] = [];
    const folder = path.resolve(params.basePath, './node_modules');
    if (fs.existsSync(folder)) {
        nodeModuleFolders.push(folder);
    }

    if (params.global !== EGlobal.DISABLE) {
        const result: child_process.SpawnSyncReturns<string> = child_process.spawnSync((os.platform() === 'win32') ? 'npm.cmd' : 'npm', ['root', '-g']);
        if (result.error) {
            if (params.global === EGlobal.REQUIRED) {
                return Promise.reject(new Error('Cannot execute npm root -g : ' + result.error));
            } else {
                LOGGER.info('Cannot execute npm root -g');
            }
        } else {
            const pathToAdd = result.stdout.toString().trim();
            if (pathToAdd) {
                nodeModuleFolders.push(pathToAdd);
            } else if (params.global === EGlobal.REQUIRED) {
                return Promise.reject(new Error('Cannot get root npm folder'));
            }
        }
    }

    // Extract all projects
    return Promise.resolve().then(() => {
        const promises: Promise<void>[] = [];
        nodeModuleFolders.forEach((nodeModuleFolder: string) => {
            promises.push(checkFolder(params, nodeModuleFolder));
        });
        return Promise.all(promises);
    }).then(() => {
        // Check current project
        checkProject(params, params.basePath);
    });
}

function checkFolder(params: ILoadParams, root: string): Promise<void> {
    return fs.readdir(root).then((folders: string[]) => {
        const promises: Promise<void>[] = [];
        folders.forEach((folder: string) => {
            if (folder.startsWith('@')) {
                promises.push(checkFolder(params, root + path.sep + folder));
            } else {
                checkProject(params, root + path.sep + folder);
            }
        });
        return Promise.all(promises).then(() => { return; });
    });
}

function checkProject(params: ILoadParams, root: string): Promise<void> {
    const promises: Promise<void>[] = [];
    const filePath: string = root + path.sep + params.baseFile;
    if (fs.existsSync(filePath)) {
        const fileContent: any = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let isOk: boolean = params.propertyDetection.length === 0;
        let subContent: any = fileContent;
        if (!isOk) {
            isOk = true;
            for (let currentIndex: number = 0; isOk && currentIndex < params.propertyDetection.length; currentIndex++) {
                if (!subContent[params.propertyDetection[currentIndex]]) {
                    isOk = false;
                }
                subContent = subContent[params.propertyDetection[currentIndex]];
            }
        }
        if (isOk) {
            LOGGER.info('Project %1 found as module', root);
            promises.push(params.onDetection(subContent, root, fileContent).then((contents: string[]) => {
                contents.forEach((content) => {
                    autoload.default(root + path.sep + content);
                });
            }));
        }
    }
    return Promise.all(promises).then(() => { return; });
}

export interface ILoadParams {
    arbitraryAdd?: string[];
    baseFile?: string;
    basePath?: string;
    global?: EGlobal;
    propertyDetection?: string[];
    onDetection?: (content: any, module: string, fullContent: any) => Promise<string[]>;
}

export enum EGlobal {
    OPTIONAL = 1,
    DISABLE = 2,
    REQUIRED = 3
}
