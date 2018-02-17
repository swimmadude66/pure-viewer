#!/usr/bin/env node
import * as program from 'commander';
import {Observable} from 'rxjs/Rx';
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

/*
* Parse auth flags to allow auth on a single command
*/
function parseAuth(cmd): Observable<any> {
    if ((!cmd) || (!cmd.username && !cmd.password && !cmd.token)) {
        return Observable.of(null); // no-op, no auth flags frovided
    } else if (cmd.password && cmd.token) {
        logger.error('You must specify exactly one of either password or token');
        process.exit(1);
    } else if (cmd.username && cmd.password) {
        logger.info('!!!!!!!!!\nAuthentication with a password may fail if your account utilizes 2FA.\n'
        +'It is reccomended that you instead generate and use a new Personal Access Token (PAT).\n'
        +'More information on PATs can be found here: https://github.com/blog/1509-personal-api-tokens\n'
        +'!!!!!!!!!\n');
        return github.auth(cmd.username, cmd.password);
    } else if (cmd.username && cmd.token){
        return github.auth(cmd.username, cmd.token);
    } else {
        logger.error('If you provide a username, you must specify exactly one of either password or token');
        process.exit(1);
    }
}


// Base info
program
    .version('1.0.0', '-v, --version')
    .description('a cli-tool to display open pull requests by user')

// Auth
program
    .command('auth <username>')
    .description('Authenticate with github and save the credentials for future requests')
    .option('-p, --password <password>', 'authenticate with a password')
    .option('-t, --token <token>', 'a Personal Access Token to use for authentication')
    .action((username, cmd) => {
        if ((!cmd) || (!cmd.password && !cmd.token) || (cmd.password && cmd.token)) {
            logger.error('You must specify exactly one of either password or token');
            process.exit(1);
        } else if (cmd.password) {
            logger.info('!!!!!!!!!\nAuthentication with a password may fail if your account utilizes 2FA.\n'
            +'It is reccomended that you instead generate and use a new Personal Access Token (PAT).\n'
            +'More information on PATs can be found here: https://github.com/blog/1509-personal-api-tokens\n'
            +'!!!!!!!!!\n');
            github.auth(username, cmd.password).subscribe(
                _ => logger.logSuccess('Authenticated successfully!'),
                err => logger.error(err)
            );
        } else {
            github.auth(username, cmd.token).subscribe(
                _ => logger.logSuccess('Authenticated successfully!'),
                err => logger.error(err)
            );
        }
    });



// github.getPRsForUsers(['swimmadude66', 'jcdelmas'])
// .subscribe(
//     user => logger.log(JSON.stringify(user, null, 2)),
//     err => logger.error(err)
// );

program.parse(process.argv);
