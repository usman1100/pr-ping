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

export interface Label {
  name: string;
  color?: string;
}

export interface ReviewRequest {
  requestedReviewer?: {
    __typename?: string;
    login: string;
  };
}

export interface PullRequest {
  number: number;
  title: string;
  body?: string;
  state?: string;
  mergeable: string;
  isDraft?: boolean;
  author?: PRAuthor | null;
  createdAt?: string;
  updatedAt?: string;
  labels?: Label[];
  reviews?: Review[] | null;
  reviewRequests?: ReviewRequest[] | null;
  statusCheckRollup: StatusCheck[] | null;
  url: string;
}

export type ViewMode =
  | { type: "all" }
  | { type: "mine" }
  | { type: "subscribed" }
  | { type: "search"; query: string };
