import {expect} from 'chai';
import {mock, instance, spy, when} from 'ts-mockito';
import {Observable} from 'rxjs/Rx';
import {ConfigService, GithubService} from '../services';

const fakeSearchResult = {
    total_count: 1,
    incomplete_results: false,
    items: [
        {
            url: "https://api.github.com/repos/testuser/testrepo/issues/123456",
            repository_url: "https://api.github.com/repos/testuser/testrepo",
            labels_url: "https://api.github.com/repos/testuser/testrepo/issues/123456/labels{/name}",
            comments_url: "https://api.github.com/repos/testuser/testrepo/issues/123456/comments",
            events_url: "https://api.github.com/repos/testuser/testrepo/issues/123456/events",
            html_url: "https://github.com/testuser/testrepo/pull/123456",
            id: 123456,
            number: 123456,
            title: "Test PR Result",
            user: {
                login: "testuser",
                id: 123456,
                avatar_url: "https://avatars1.githubusercontent.com/u/123456?v=4",
                gravatar_id: "",
                url: "https://api.github.com/users/testuser",
                html_url: "https://github.com/testuser",
                followers_url: "https://api.github.com/users/testuser/followers",
                following_url: "https://api.github.com/users/testuser/following{/other_user}",
                gists_url: "https://api.github.com/users/testuser/gists{/gist_id}",
                starred_url: "https://api.github.com/users/testuser/starred{/owner}{/repo}",
                subscriptions_url: "https://api.github.com/users/testuser/subscriptions",
                organizations_url: "https://api.github.com/users/testuser/orgs",
                repos_url: "https://api.github.com/users/testuser/repos",
                events_url: "https://api.github.com/users/testuser/events{/privacy}",
                received_events_url: "https://api.github.com/users/testuser/received_events",
                type: "User",
                site_admin: false
            },
            labels: [],
            state: "open",
            locked: false,
            assignee: {
                login: "testuser",
                id: 123456,
                avatar_url: "https://avatars1.githubusercontent.com/u/123456?v=4",
                gravatar_id: "",
                url: "https://api.github.com/users/testuser",
                html_url: "https://github.com/testuser",
                followers_url: "https://api.github.com/users/testuser/followers",
                following_url: "https://api.github.com/users/testuser/following{/other_user}",
                gists_url: "https://api.github.com/users/testuser/gists{/gist_id}",
                starred_url: "https://api.github.com/users/testuser/starred{/owner}{/repo}",
                subscriptions_url: "https://api.github.com/users/testuser/subscriptions",
                organizations_url: "https://api.github.com/users/testuser/orgs",
                repos_url: "https://api.github.com/users/testuser/repos",
                events_url: "https://api.github.com/users/testuser/events{/privacy}",
                received_events_url: "https://api.github.com/users/testuser/received_events",
                type: "User",
                site_admin: false
            },
            assignees: [{
                login: "testuser",
                id: 123456,
                avatar_url: "https://avatars1.githubusercontent.com/u/123456?v=4",
                gravatar_id: "",
                url: "https://api.github.com/users/testuser",
                html_url: "https://github.com/testuser",
                followers_url: "https://api.github.com/users/testuser/followers",
                following_url: "https://api.github.com/users/testuser/following{/other_user}",
                gists_url: "https://api.github.com/users/testuser/gists{/gist_id}",
                starred_url: "https://api.github.com/users/testuser/starred{/owner}{/repo}",
                subscriptions_url: "https://api.github.com/users/testuser/subscriptions",
                organizations_url: "https://api.github.com/users/testuser/orgs",
                repos_url: "https://api.github.com/users/testuser/repos",
                events_url: "https://api.github.com/users/testuser/events{/privacy}",
                received_events_url: "https://api.github.com/users/testuser/received_events",
                type: "User",
                site_admin: false
            }],
            milestone: null,
            comments: 1,
            created_at: "2017-11-03T12:30:54Z",
            updated_at: "2018-01-27T08:50:39Z",
            closed_at: "2018-01-27T08:50:30Z",
            author_association: "NONE",
            pull_request: {
                url: "https://api.github.com/repos/testuser/testrepo/pulls/123456",
                html_url: "https://github.com/testuser/testrepo/pull/123456",
                diff_url: "https://github.com/testuser/testrepo/pull/123456.diff",
                patch_url: "https://github.com/testuser/testrepo/pull/123456.patch"
            },
            body: "Test PR Result",
            score: 1
        }
    ]
};

describe('GithubService', () => {

    let githubService: GithubService;

    before(() => {
        const config: ConfigService = mock(ConfigService);
        githubService = new GithubService(instance(config));
        const spiedGithub = spy(githubService);

        when(spiedGithub['_searchIssues'](`type:pr state:open author:testuser`))
        .thenReturn(Observable.of(fakeSearchResult));

        when(spiedGithub['_searchIssues'](`type:pr state:open asignee:testuser`))
        .thenReturn(Observable.of(fakeSearchResult));
    });

    it('should format author search results', (done) => {
        githubService.getPRsForAuthors(['testuser'])
        .subscribe(
            PRMap => {
                expect(PRMap).to.not.be.null;
                expect(PRMap).to.have.key('testuser');
                expect(PRMap['testuser']).to.have.keys(['username', 'total', 'pull_requests']);
                expect(PRMap['testuser'].username).to.equal('testuser');
                expect(PRMap['testuser'].total).to.equal(1);
                expect(PRMap['testuser'].pull_requests).to.have.length(1, 'Pull requests does not match total');
                const prinfo = PRMap['testuser'].pull_requests[0];
                expect(prinfo.author).to.equal('testuser');
                expect(prinfo.repository).to.equal('testuser/testrepo');
                expect(prinfo.assignees).to.not.be.null;
                expect(prinfo.assignees).to.equal('testuser', 'incorrectly parsed asignees')
                done();
            },
            err => done(err)
        );
    });

    it('should format assignee search results', (done) => {
        githubService.getPRsForAssignees(['testuser'])
        .subscribe(
            PRMap => {
                expect(PRMap).to.not.be.null;
                expect(PRMap).to.have.key('testuser');
                expect(PRMap['testuser']).to.have.keys(['username', 'total', 'pull_requests']);
                expect(PRMap['testuser'].username).to.equal('testuser');
                expect(PRMap['testuser'].total).to.equal(1);
                expect(PRMap['testuser'].pull_requests).to.have.length(1, 'Pull requests does not match total');
                const prinfo = PRMap['testuser'].pull_requests[0];
                expect(prinfo.author).to.equal('testuser');
                expect(prinfo.repository).to.equal('testuser/testrepo');
                expect(prinfo.assignees).to.not.be.null;
                expect(prinfo.assignees).to.equal('testuser', 'incorrectly parsed asignees')
                done();
            },
            err => done(err)
        );
    });
});
