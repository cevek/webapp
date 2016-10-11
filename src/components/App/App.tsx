import * as React from "react";
import {Header} from "./Header/Header";
import {Footer} from "./Footer/Footer";

export interface AppProps {

}

export class App extends React.Component<AppProps, {}> {
    render() {
        return (
            <div className="app__wrapper">
                <div className="app__main">
                    <Header/>
                    <div className="container">
                        {this.props.children}
                    </div>
                </div>
                <div className="yow-man yellow"></div>
                <Footer/>
            </div>
        );
    }
}
