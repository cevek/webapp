import * as React from "react";
import {Issues} from "./Issues";

describe('Issues', () => {
    let renderer: any;
    beforeEach(() => {
                                    
    });
    
    it('case1', () => {
        const result = renderer(<Issues/>);
        expect(result).toEqual(<div className="issues">Issues</div>);
    });
});