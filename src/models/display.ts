
export interface PullRequestInfo {
    author: string;
    repository: string;
    link: string;
    title: string;
    opened_at: string;
    updated_at: string;
}

export interface UserInfo {
    username: string;
    total: number;
    pull_requests: PullRequestInfo[];
}
