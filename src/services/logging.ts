import * as colors from 'colors/safe';
import {ConfigService} from './config';

export class LoggingService {
    private _logger = console;

    constructor (private _config: ConfigService) {
        // TODO: make colors configurable; make logger configurable
    }

    log(message: string): void {
        this._logger.log(message);
    }

    info(message: string) {
        this._logger.info(colors.yellow(message));
    }

    error(message: string) {
        this._logger.error(colors.red(message));
    }

    logSuccess(message: string) {
        this._logger.log(colors.green(message));
    }
}
