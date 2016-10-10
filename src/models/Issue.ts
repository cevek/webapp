import {User, UserJSON} from "./User";
import {config} from "../config";
import {FastPromise} from "../../lib/services/Promise/Promise";
import {UserComment} from "./UserComment";
import {UserCommentStore} from "./UserCommentStore";

interface LabelJSON {
    url: string;
    name: string;
    color: string;
}

interface PullRequestJSON {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
}

export interface IssueJSON {
    url: string;
    repository_url: string;
    labels_url: string;
    comments_url: string;
    events_url: string;
    html_url: string;
    id: number;
    number: number;
    title: string;
    user: UserJSON;
    labels: LabelJSON[];
    state: string;
    locked: boolean;
    assignee: string;
    assignees: any[];
    milestone: string;
    comments: number;
    created_at: string;
    updated_at: string;
    closed_at: string;
    closed_by: UserJSON;
    pull_request: PullRequestJSON;
    body: string;
}


export class Issue {
    number: number;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    body: string;
    closedAt: Date;
    user: User;

    fromJSON(json: IssueJSON) {
        this.number = json.number;
        this.createdAt = new Date(json.created_at);
        this.updatedAt = new Date(json.updated_at);
        this.title = json.title;
        this.body = json.body;
        this.closedAt = json.closed_at ? new Date(json.closed_at) : null;
        return this;
    }
}

export class IssueFull extends Issue {
    private url = `https://api.github.com/repos/${config.company}/${config.repo}/issues/${this.number}?client_id=${config.clientId}&client_secret=${config.clientSecret}`;

    userComments: UserCommentStore;
    closedBy: User;

    constructor(public number: number) {
        super();
    }

    fromJSON(json: IssueJSON, userComments?: UserCommentStore) {
        this.closedBy = json.closed_by ? new User(json.closed_by) : null;
        this.userComments = userComments;
        return super.fromJSON(json);
    }

    fetch() {
        const p = new FastPromise<this>();
        const userCommentsStorePromise = new UserCommentStore(this.number).fetch();

        fetch(this.url).then((response: any) => response.json()).then((issueJSON: IssueJSON) => {
            userCommentsStorePromise.then(userComments => {
                this.fromJSON(issueJSON, userComments);
                p.resolve(this);
            });

        })
        return p;
    }
}