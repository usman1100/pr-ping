export interface StatusCheck {
  __typename?: string;
  name?: string;
  context?: string;
  conclusion: string | null;
  status: string | null;
  state?: string | null;
}

export interface PRAuthor {
  login: string;
}

export interface Review {
  state: string;
  author?: PRAuthor | null;
}

export interface PullRequest {
  number: number;
  title: string;
  mergeable: string;
  isDraft?: boolean;
  author?: PRAuthor | null;
  reviews?: Review[] | null;
  statusCheckRollup: StatusCheck[] | null;
  url: string;
}
