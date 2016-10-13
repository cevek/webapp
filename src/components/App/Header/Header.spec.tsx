import * as React from 'react';
import {Header} from './Header';

describe('Header', () => {
    let renderer: any;
    beforeEach(() => {
                                    
    });
    
    it('case1', () => {
        const result = renderer(<Header/>);
        expect(result).toEqual(<div className="header">Header</div>);
    });
});