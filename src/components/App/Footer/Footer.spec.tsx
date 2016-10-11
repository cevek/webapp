import * as React from 'react';
import * as ReactTestUtils from 'react-addons-test-utils';
import {Footer} from './Footer';
import * as github from './github.svg';


const renderer = ReactTestUtils.createRenderer();

describe('Footer', () => {
    beforeEach(() => {

    });
    it('case1', () => {
        renderer.render(<Footer/>);
        const result = renderer.getRenderOutput();
        expect(result).toEqualJSX(
            <div className="footer">
                <div className="container">
                    <img src={github} alt="github"/>
                </div>
            </div>
        );
    });
});
