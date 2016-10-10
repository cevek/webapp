import * as React from "react";
import * as classNames from "classnames";
import * as styles from "./App.scss";
import * as bs from "../../styles/bootstrap.scss";
import {Header} from "./Header/Header";
import {Footer} from "./Footer/Footer";
import {headerVM} from './HeaderVM';

headerVM.title;
export interface AppProps {

}

export class App extends React.Component<AppProps, {}> {

    render() {
        return (
            <div className={classNames(bs.nav, styles.wrapper)}>
                <div className={styles.main}>
                    <Header/>
                    <div className={classNames(bs.container)}>
                        {this.props.children}
                    </div>
                </div>
                <div className="yow-man yellow"></div>
                <Footer/>
            </div>
        );
    }
}
