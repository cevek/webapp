import * as React from 'react';
import {HeaderVM} from '../HeaderVM';
import {observer} from 'mobx-react';
import {inject} from '../../../../lib/services/Injector/Injector';

interface HeaderProps {

}

@observer
export class Header extends React.Component<HeaderProps, {}> {
    headerVM = inject(HeaderVM);

    render() {
        return (
            <div className="header">
                <div className="container">
                    {this.headerVM.uppercaseTitle}
                </div>
            </div>
        );
    }
}