export interface SearchResult<T> {
    total_count: number;
    incomplete_results: boolean;
    items: T[];
}

export interface User {
    login: string;
    id: number;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
}

export interface Milestone {
    url: string;
    html_url: string;
    labels_url: string;
    id: number;
    number: number;
    title: string;
    description: string;
    creator: User;
    open_issues: number;
    closed_issues: number;
    state: string;
    created_at: string;
    updated_at: string;
    due_on?: any,
    closed_at?: any;
}

export interface PullRequest {
    url: string;
    repository_url: string;
    labels_url: string;
    comments_url: string;
    events_url: string;
    html_url: string;
    id: number;
    number: number;
    title: string;
    user: User;
    labels: any[];
    state: string;
    locked: boolean;
    assignee?: User;
    assignees: User[],
    milestone?: Milestone;
    comments: number;
    created_at: string;
    updated_at?: string;
    closed_at?: string,
    author_association: string;
    pull_request: {
        url: string;
        html_url: string;
        diff_url: string;
        patch_url: string;
    },
    body: string;
    score: number;
}


