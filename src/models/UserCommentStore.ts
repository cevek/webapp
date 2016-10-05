import {FastPromise} from "../../lib/services/Promise/Promise";
import {config} from "../config";
import {UserComment, UserCommentJSON} from "./UserComment";

export class UserCommentStore {
    url = `https://api.github.com/repos/${config.company}/${config.repo}/issues/${this.id}/comments`;
    items: UserComment[];

    constructor(public id: number) {}

    fromJSON(json: UserCommentJSON[]) {
        this.items = json.map(json => new UserComment(json));
        return this;
    }

    fetch() {
        const p = new FastPromise<this>();
        fetch(this.url).then((response: any) => response.json()).then((userCommentsJSON: UserCommentJSON[]) => {
            this.fromJSON(userCommentsJSON);
            p.resolve(this);
        })
        return p;
    }
}