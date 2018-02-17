import * as request from 'request';
import {Observable} from 'rxjs/Rx';
import {ConfigService} from './config';
import {
    SearchResult,
    PullRequest,
    User,
    PullRequestInfo,
    UserInfo,
} from '../models';

type Requester = request.RequestAPI<request.Request, request.CoreOptions, request.RequiredUriUrl>;

export class GithubService {

    private _api: Requester;

    constructor(
        private _config: ConfigService
    ) {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'pure-viewer-cli'
        };

        if (_config.hasKey('auth')) {
            headers['Authorization'] = `BASIC ${_config.getConfig('auth')}`;
        }
        this._api = request.defaults({
            baseUrl: 'https://api.github.com',
            headers
        });
    }

    /*
    * Authenticate for this and future requests. Accepts Username and either Password or Token
    * This method allows parsing of repos, projects, and issues visible to your account
    * 
    * @param username: your github username
    * @param password: your password or personal access token
    */
    auth(username: string, password: string): Observable<Requester> {
        const basicAuth = new Buffer(`${username}:${password}`, 'utf8').toString('base64');
        const newDefault = this._api.defaults({headers: {Authorization: `BASIC ${basicAuth}`}});
        return Observable.create(observer => {
            newDefault.get('/user', (err, response, body) => {
                if (err || !response) {
                    observer.error(err);
                } else if (response.statusCode !== 200) {
                    try {
                        const json = JSON.parse(body);
                        observer.error(body.message || 'Could not authenticate');
                    } catch(e) {
                        observer.error('Could not Authenticate');
                    }
                } else {
                    this._api = newDefault;
                    this._config.setConfig('auth', basicAuth);
                    observer.next(newDefault);
                    observer.complete(newDefault);
                }
            });
        });
    }

    /*
    * Returns the 100 most recently updated PRs authored by each of the users
    * @param users: a list of github usernames to look for
    */
    getPRsForUsers(users: string[]): Observable<{[username: string]: UserInfo}> {
        const requests = [];
        users.forEach(u => {
            requests.push(this.getPRsForUser(u));
        });
        return Observable.forkJoin(requests)
        .map((responses: SearchResult<PullRequest>[]) => {
            const userMap = {};
            users.forEach((u: string, i: number) => {
                const result = responses[i];
                const prs = result.items.map(item => this._parsePRInfo(item));
                userMap[u] = {
                    username: u,
                    total: result.total_count,
                    pull_requests: prs 
                }
            });
            return userMap;
        });
    }

    /*
    * Returns the 100 most recently updated open PRs authored by the given user
    * @param username: the github username of the user to lookup 
    */
    getPRsForUser(username: string): Observable<SearchResult<PullRequest>> {
        return Observable.create(observer => {
            this._api.get(`/search/issues?sort=updated&q=type:pr state:open author:${username}`, (err, response, body) => {
                if (err) {
                    observer.error(err);
                } else {
                    try {
                        const json = JSON.parse(body);
                        observer.next(json);
                        observer.complete(json);
                    } catch (e) {
                        observer.error(e);
                    }
                }
            });
        });
    }

    /*
    * Returns an object containing github profile information for the provided user
    * @param username: the github username to lookup
    */
    getUser(username: string): Observable<User> {
        return Observable.create(observer => {
            this._api.get(`/users/${username}`, (err, response, body) => {
                if (err) {
                    observer.error(err);
                } else {
                    try {
                        const json = JSON.parse(body);
                        observer.next(json);
                        observer.complete(json);
                    } catch (e) {
                        observer.error(e);
                    }
                }
            });
        });
    }

    private _parseRepoName(repo_url: string): string {
        return repo_url.replace(/^.*?(([^/]+)\/([^/]+))$/ig, '$1');
    }

    private _parsePRInfo(info: PullRequest): PullRequestInfo {
        const cleanPR = {
            author: info.user.login,
            repository: this._parseRepoName(info.repository_url),
            link: info.pull_request.html_url,
            title: info.title || 'NO TITLE',
            opened_at: info.created_at.toString(),
            updated_at: info.updated_at.toString() || info.created_at.toString()
        };
        return cleanPR;
    }
}
