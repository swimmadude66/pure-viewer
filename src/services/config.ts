import {readFileSync, writeFileSync, existsSync, write} from 'fs';
import {homedir} from 'os';
import {join} from 'path';

const CONFIG_LOCATION = join(homedir(),'./.pure-config');

export class ConfigService {

    private _configuration: {[key: string]: string};

    constructor(private _configFileLocation = CONFIG_LOCATION) {
        this._configuration = {};
        const hasConfig = existsSync(_configFileLocation);
        if (hasConfig) {
            try {
                const fileContents = readFileSync(_configFileLocation);
                this._configuration = JSON.parse(fileContents.toString() || '{}');
            } catch (e) {
                console.error('Could not read config file!');
            }
            
        } else {
            writeFileSync(_configFileLocation, '{}');
        }
    }

    getConfig(key?: string): string | {[key:string]: string} {
        if (key) {
            return this._configuration[key];
        } else {
            return this._configuration;
        }
    }

    setConfig(key: string, value: string): void {
        this._configuration[key] = value;
        writeFileSync(this._configFileLocation, JSON.stringify(this._configuration));
    }

    deleteConfig(key?: string): void {
        if (key) {
            delete this._configuration[key];
        } else {
            this._configuration = {};
        }
        writeFileSync(this._configFileLocation, JSON.stringify(this._configuration));
    }

    hasKey(key: string): boolean {
        return this._configuration && (key in this._configuration);
    }

}
