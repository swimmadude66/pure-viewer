import {ConfigService} from './config';

export class AliasService {
    private _aliases: {[key: string]: string[]};

    constructor(private _config: ConfigService) {
        this._aliases = JSON.parse(<string>_config.getConfig('aliases') || '{}');
    }

    getAlias(key?: string): string[] | {[key: string]: string[]} {
        if (key in this._aliases) {
            return this._aliases[key] || [];
        } else {
            return this._aliases || {};
        }
    }

    setAlias(key: string, value: string[]): void {
        this._aliases[key] = value;
        this._updateConfig();
    }

    deleteAlias(key?: string): void {
        if (key && (key in this._aliases)) {
            delete this._aliases[key];
        } else {
            this._aliases = {};
        }
        this._updateConfig();
    }

    private _updateConfig(): void {
        this._config.setConfig('aliases', JSON.stringify(this._aliases));
    }
}
