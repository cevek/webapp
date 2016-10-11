import * as React from 'react';
import * as github from './github.svg';

interface FooterProps {
    
}
export class Footer extends React.Component<FooterProps, {}> {
    render() {
        return (
            <div className="footer">
                <div className="container">
                    <img src={github} alt="github"/>
                </div>
            </div>
        );
    }
}