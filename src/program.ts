#!/usr/bin/env node
import * as program from 'commander';
import {Observable} from 'rxjs/Rx';
import {prompt} from 'inquirer';
import {
    AliasService,
    ConfigService,
    GithubService,
    LoggingService,
} from './services';

const configService: ConfigService = new ConfigService();
const github: GithubService = new GithubService(configService);
const alias: AliasService = new AliasService(configService);
const logger: LoggingService = new LoggingService(configService);

const passwordPrompt = {type: 'password', name: 'password', message: 'Enter Password:'};
const tokenPrompt = {type: 'password', name: 'token', message: 'Enter Token:'};

function coerceList(value: string) {
    return value.split(/\s*(,|\s+)\s*/g);
}

/*
* Parse auth flags to allow auth on a single command
*/
function parseAuth(opts): Observable<any> {
    if ((!opts) || (!opts.username && !opts.password && !opts.token)) {
        return Observable.of(null); // no-op, no auth flags frovided
    } else if (opts.password && opts.token) {
        logger.error('You must specify exactly one of either password or token');
        process.exit(1);
    } else if (opts.username && opts.password) {
        logger.info('!!!!!!!!!\nAuthentication with a password may fail if your account utilizes 2FA.\n'
        +'It is reccomended that you instead generate and use a new Personal Access Token (PAT).\n'
        +'More information on PATs can be found here: https://github.com/blog/1509-personal-api-tokens\n'
        +'!!!!!!!!!\n');
        return Observable.fromPromise(prompt([tokenPrompt])) 
        .flatMap(answers => github.auth(opts.username, answers['password']));
    } else if (opts.username && opts.token) {
        return Observable.fromPromise(prompt([tokenPrompt]))
        .flatMap(answers => github.auth(opts.username, answers['token']));
    } else {
        logger.error('If you provide a username, you must specify exactly one of either password or token');
        process.exit(1);
    }
}


// Base info
program
    .version('1.0.0', '-v, --version')
    .description('a cli-tool to display open pull requests by user')
    .option('-u, --username <username>', 'Authenticate as this github user')
    .option('-p, --password', 'Authenticate with a password')
    .option('-t, --token', 'Authenticate with a github Personal Access Token');

// Set Config
program
    .command('config-set <key> <value>')
    .description('Set a configuration value')
    .action((key, value, cmd) => {
        configService.setConfig(key, value);
        logger.logSuccess(`${key} = ${configService.getConfig(key)}`);
    });

// Get Config
program
    .command('config-get [key]')
    .description('get a configuration value or all values')
    .action((key, cmd) => {
        const result = configService.getConfig(key || undefined);
        if (typeof result === 'string') {
            logger.log(`${key} = ${result}`);
        } else {
            logger.log(JSON.stringify(result, null, 2));
        }
    });

// Delete Config
program
    .command('config-delete [keys...]')
    .description('delete a config keys')
    .action((keys, cmd) => {
        if (!keys) {
            configService.deleteConfig();
            logger.logSuccess('Config cleared');
        } else {
            keys.forEach(k => {
                configService.deleteConfig(k);
            });
            logger.logSuccess('Config keys deleted');
        }
    });


// Auth
program
    .command('auth <username>')
    .description('Authenticate with github and save the credentials for future requests')
    .action((username, cmd) => {
        const opts = {...cmd, ...cmd.parent}; // capture options from parent too
        if ((!opts) || (!opts.password && !opts.token) || (opts.password && opts.token)) {
            logger.error('You must specify exactly one of either password or token');
            process.exit(1);
        } else if (opts.password) {
            logger.info('!!!!!!!!!\nAuthentication with a password may fail if your account utilizes 2FA.\n'
            +'It is reccomended that you instead generate and use a new Personal Access Token (PAT).\n'
            +'More information on PATs can be found here: https://github.com/blog/1509-personal-api-tokens\n'
            +'!!!!!!!!!\n');
            prompt([passwordPrompt]).then(answers => {
                const pwd = answers['password'];
                github.auth(username, pwd)
                .subscribe(
                    _ => logger.logSuccess('Authenticated successfully!'),
                    err => logger.error(err)
                );
            });
        } else {
            prompt([tokenPrompt]).then(answers => {
                const token = answers['token'];
                github.auth(username, token).subscribe(
                    _ => logger.logSuccess('Authenticated successfully!'),
                    err => logger.error(err)
                );
            });
        }
    });

// Get PRs for users
program
    .command('fetch <user> [moreUsers...]')
    .description('Retrieve all open pull requests for the given user or users')
    .action((user, moreUsers, cmd) => {
        const opts = {...cmd, ...cmd.parent}; // capture options from parent too
        const allUsers = [user].concat(moreUsers || []);
        parseAuth(opts)
        .flatMap(_ => github.getPRsForUsers(allUsers))
        .subscribe(
            PRs => logger.log(JSON.stringify(PRs, null, 2)),
            err => logger.error(err)
        );
    });

program.parse(process.argv);
