import * as React from 'react';

interface FooterProps {
    
}
export class Footer extends React.Component<FooterProps, {}> {
    render() {
        return (
            <div className="footer">
                <div className="container">
                    {/*<img src={github} alt="github"/>*/}
                    <div className="footer__logo">github</div>
                </div>
            </div>
        );
    }
}