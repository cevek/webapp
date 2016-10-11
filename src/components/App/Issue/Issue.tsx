import * as React from "react";
import {IssueFull} from "../../../models/Issue";
import {formatDate} from "../../../services/Utils";
import {HeaderVM} from '../HeaderVM';
import {inject} from '../../../../lib/services/Injector/Injector';

interface IssueProps {
    issue: IssueFull;
    params: {id: number};
}

export class Issue extends React.Component<IssueProps, {}> {
    static resolve(props: IssueProps) {
        return new IssueFull(props.params.id).fetch().then(issue => {
            inject(HeaderVM).title = issue.title;
            props.issue = issue;
        });
    }

    render() {
        return (
            <div className="issue">
                <div className="issue__jumbotron jumbotron jumbotron-fluid">
                    <h1 className="display-3 issue__title">{this.props.issue.title}</h1>
                    <article className="lead issue__article">{this.props.issue.body}</article>
                </div>
                {this.props.issue.userComments.items.map(userComment =>
                    <div className="issue__comment-body" key={userComment.id}>
                        <img
                            src={userComment.user.avatarUrl}
                            className="issue__avatar"
                            alt={userComment.user.login}
                        />
                        <div className="issue__text">
                            <div className="issue__author">{userComment.user.login}</div>
                            <div className="issue__time">{formatDate(userComment.createdAt)}</div>
                            <div className="issue__comment-text">{userComment.body}</div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
