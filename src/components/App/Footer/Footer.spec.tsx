import * as React from 'react';
import * as ReactTestUtils from 'react-addons-test-utils';
import {Footer} from './Footer';

const renderer = ReactTestUtils.createRenderer();

describe('Footer', () => {
    beforeEach(() => {

    });
    it('case1', () => {
        renderer.render(<Footer/>);
        const result = renderer.getRenderOutput();
        expect(result).toEqualJSX(
            <div className="footer">
                Footer
            </div>
        );
    });
});
