import * as React from 'react';
import {FastPromise} from "../../services/Promise/Promise";

interface ActionButtonProps {
    onClick: () => FastPromise<any> | void;
    className?: any;
}

export class ActionButton extends React.Component<ActionButtonProps, {}> {
    disabled = false;
    mounted: boolean;
    onClick = () => {
        const promise = this.props.onClick();
        if (promise instanceof FastPromise) {
            this.disabled = true;
            let called = false;
            promise.then(() => {
                this.disabled = false;
                called = true;
                if (this.mounted) {
                    this.forceUpdate();
                }
            });
            if (!called) {
                if (this.mounted) {
                    this.forceUpdate();
                }
            }
        }
    };


    componentDidMount(): void {
        this.mounted = true;
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    render() {
        return (
            <button
                disabled={this.disabled}
                onClick={this.onClick}
                className={this.props.className}
            >
                {this.props.children}
            </button>
        );
    }
}
