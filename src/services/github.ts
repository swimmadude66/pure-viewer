import * as request from 'request';
import {Observable} from 'rxjs/Rx';
import {ConfigService} from './config';
import {SearchResult, PullRequest, User} from '../models/github';

export class GithubService {

    private _api: request.RequestAPI<request.Request, request.CoreOptions, request.RequiredUriUrl>;

    constructor(
        private _config: ConfigService
    ) {
        this._api = request.defaults({
            baseUrl: 'https://api.github.com',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'pure-viewer-cli'
            }
        });
    }

    /*
    * Returns the 100 most recently updated PRs authored by each of the users
    * @param users: a list of github usernames to look for
    */
    getPRsForUsers(users: string[]): Observable<{[username: string]: SearchResult<PullRequest>}> {
        const requests = [];
        users.forEach(u => {
            requests.push(this.getPRsForUser(u));
        });
        return Observable.forkJoin(requests)
        .map(responses => {
            const userPRs = {};
            users.forEach((u: string, i: number) => {
                userPRs[u] = responses[i];
            });
            return userPRs;
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

    private _parsePRInfo(info: any): any {
        const cleanPR = {
            repository: info.repository_url
        }
    }
}
