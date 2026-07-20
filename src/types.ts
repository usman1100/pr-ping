export interface StatusCheck {
  __typename?: string;
  name?: string;
  context?: string;
  conclusion: string | null;
  status: string | null;
  state?: string | null;
}

export interface PullRequest {
  number: number;
  title: string;
  mergeable: string;
  isDraft?: boolean;
  statusCheckRollup: StatusCheck[] | null;
  url: string;
}
