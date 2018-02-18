#!/usr/bin/env node
import * as program from 'commander';
import * as colors from 'colors';
import {Observable} from 'rxjs/Rx';
import {prompt} from 'inquirer';
import {
    AliasService,
    ConfigService,
    GithubService,
    LoggingService,
} from './services';
import {UserInfo} from './models';

// Services Used
const configService: ConfigService = new ConfigService();
const aliasService: AliasService = new AliasService(configService);
const github: GithubService = new GithubService(configService);
const logger: LoggingService = new LoggingService(configService);

// Re-usable prompts
const passwordPrompt = {type: 'password', name: 'password', message: 'Enter Password:'};
const tokenPrompt = {type: 'password', name: 'token', message: 'Enter Token:'};

// Helper functions

/*
* Parse auth flags to allow auth on a single command
* @param opts: the options object returned by commander
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

/*
* Format the results of the github calls in a cli-friendly way
* @param PRMap: the mapping of usernames to results from github
*/
function formatResults(PRMap: {[username: string]: UserInfo}) {
    let output = '';
    Object.keys(PRMap).forEach(u => {
        output += `\n${u}`;
        const userInfo = PRMap[u];
        output += `\nTotal Open Pull Requests: ${userInfo.total}`;
        if (userInfo.total) {
            userInfo.pull_requests.forEach(pr => {
                output += `\n  - ${pr.title}`;
                output += colors.blue(`\n\t  ${pr.link}`);
                output += `\n\t  Author: ${pr.author}`;
                output += `\n\t  Assigned: ${pr.assignees ||'No one assigned'}`;
                output += `\n\t  Repo: ${pr.repository}`;
                output += `\n\t  Opened: ${pr.opened_at}`;
                output += `\n\t  Updated: ${pr.updated_at}\n`;
            });
        }
        output += '\n=============================================\n';
    });
    return output;
}

// Program commands

// Base info
program
    .version('1.0.0', '-v, --version')
    .description('a cli-tool to display open pull requests by user')
    .option('-u, --username <username>', 'Authenticate as this github user')
    .option('-p, --password', 'Authenticate with a password')
    .option('-t, --token', 'Authenticate with a github Personal Access Token')
    .option('--no-color', 'Disables console output colors and style');

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

// Set Alias
program
    .command('alias-set <key> <user> [moreUsers...]')
    .description('Create an alias for a group of users')
    .action((key, user, moreUsers, cmd) => {
        const users = [user];
        if (moreUsers) {
            users.push(...moreUsers);
        }
        aliasService.setAlias(key, users);
        logger.logSuccess(`alias: ${key} = ${users.join(', ')}`);
    });

// Get Alias
program
    .command('alias-get [key]')
    .description('get the value of an alias or view all')
    .action((key, cmd) => {
        const result = aliasService.getAlias(key || undefined);
        if (Array.isArray(result)) {
            logger.log(`${key} = ${result.join(', ')}`);
        } else {
            logger.log(JSON.stringify(result, null, 2));
        }
    });

// Delete Alias
program
    .command('alias-delete [keys...]')
    .description('delete aliases')
    .action((keys, cmd) => {
        if (!keys) {
            aliasService.deleteAlias();
            logger.logSuccess('Config cleared');
        } else {
            keys.forEach(k => {
                aliasService.deleteAlias(k);
            });
            logger.logSuccess('Aliases deleted');
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

// Get PRs for by author
program
    .command('by-author <user> [moreUsers...]')
    .description('Retrieve all open pull requests authored by the given user(s)')
    .action((user, moreUsers, cmd) => {
        const opts = {...cmd, ...cmd.parent}; // capture options from parent too
        const allUsers = [user].concat(moreUsers || []);
        const resolved = allUsers.reduce((prev, curr) => {
            const alias = <string[]>aliasService.getAlias(curr);
            if (alias && alias.length) {
                prev.push(...alias);
            } else {
                prev.push(curr);
            }
            return prev;
        }, []);
        parseAuth(opts)
        .flatMap(_ => github.getPRsForAuthors(resolved))
        .subscribe(
            PRMap => {
                logger.log(formatResults(PRMap));
            },
            err => logger.error(err)
        );
    });

program
    .command('by-assignee <user> [moreUsers...]')
    .description('Retrieve all open pull requests assigned to the given user(s)')
    .action((user, moreUsers, cmd) => {
        const opts = {...cmd, ...cmd.parent}; // capture options from parent too
        const allUsers = [user].concat(moreUsers || []);
        const resolved = allUsers.reduce((prev, curr) => {
            const alias = <string[]>aliasService.getAlias(curr);
            if (alias && alias.length) {
                prev.push(...alias);
            } else {
                prev.push(curr);
            }
            return prev;
        }, []);
        parseAuth(opts)
        .flatMap(_ => github.getPRsForAssignees(resolved))
        .subscribe(
            PRMap => {
                logger.log(formatResults(PRMap));
            },
            err => logger.error(err)
        );
    });

program.parse(process.argv);
