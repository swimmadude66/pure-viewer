import {readFileSync, writeFileSync, existsSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';

const CONFIG_LOCATION = join(homedir(),'./.pure-config');

export class ConfigService {

    private _configuration: {[key: string]: string};

    constructor() {
        const hasConfig = existsSync(CONFIG_LOCATION);
        if (hasConfig) {
            JSON.parse(readFileSync(CONFIG_LOCATION).toString());
        } else {
            writeFileSync(CONFIG_LOCATION, '{}');
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
        writeFileSync(CONFIG_LOCATION, JSON.stringify(this._configuration));
    }

    hasKey(key: string): boolean {
        return this._configuration && (key in this._configuration);
    }

}
