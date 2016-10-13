import * as React from "react";
import {Issue} from "./Issue";

describe('Issue', () => {
    let renderer: any;
    beforeEach(() => {
                                    
    });
    
    it('case1', () => {
        const result = renderer(<Issue/>);
        expect(result).toEqual(<div className="issue">Issue</div>);
    });
});