import * as React from "react";
import * as classNames from "classnames";
import * as styles from "./Issues.scss";
import {IssuesStore} from "../../../models/IssuesStore";
import {ActionButton} from "../../../../lib/components/ActionButton/ActionButton";
import {IndexRoute} from "../../../routes";
import {observer} from "mobx-react";
import {HeaderVM} from '../HeaderVM';
import {inject} from '../../../../lib/services/Injector/Injector';

interface IssuesProps {
    issues: IssuesStore;
}

@observer
export class Issues extends React.Component<IssuesProps, {}> {
    static resolve(props: IssuesProps) {
        return new IssuesStore().fetch().then(issues => {
            inject(HeaderVM).title = "Issues: " + issues.items.length;
            props.issues = issues;
        });
    }

    onDelete(posNumber: number) {
        return this.props.issues.delete(posNumber);
    }

    render() {
        return (
            <div className={classNames(styles.issues)}>
                <ul>
                    {this.props.issues.items.map((issue, pos) =>
                        <li key={issue.number}>
                            <ActionButton
                                onClick={()=>IndexRoute.issue.goto({id: issue.number})}
                            >
                                {issue.title}
                            </ActionButton>
                            <ActionButton onClick={() => this.onDelete(pos)}>
                                X
                            </ActionButton>
                        </li>
                    )}
                </ul>
            </div>
        );
    }
}