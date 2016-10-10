import * as React from "react";
import * as classNames from "classnames";
import * as styles from "./Issue.scss";
import {IssueFull} from "../../../models/Issue";
import {formatDate} from "../../../services/Utils";
import {headerVM} from "../HeaderVM";

interface IssueProps {
    issue: IssueFull;
    params: {id: number};
}

export class Issue extends React.Component<IssueProps, {}> {
    static resolve(props: IssueProps) {
        return new IssueFull(props.params.id).fetch().then(issue => {
            headerVM.title = issue.title;
            props.issue = issue;
        });
    }

    render() {
        return (
            <div className={classNames(styles.issue)}>
                <h1 className={classNames(styles.title)}>{this.props.issue.title}</h1>
                <article className={classNames(styles.article)}>{this.props.issue.body}</article>
                {this.props.issue.userComments.items.map(userComment =>
                    <div className={classNames(styles.commentBody)} key={userComment.id}>
                        <img
                            src={userComment.user.avatarUrl}
                            className={classNames(styles.userAvatar)}
                            alt={userComment.user.login}
                        />
                        <div>
                            <div className={classNames(styles.author)}>{userComment.user.login}</div>
                            <div className={classNames(styles.time)}>{formatDate(userComment.createdAt)}</div>
                            <div className={classNames(styles.commentText)}>{userComment.body}</div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
