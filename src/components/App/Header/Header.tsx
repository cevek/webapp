import * as React from 'react';
import * as classNames from 'classnames';
import * as styles from './Header.scss';
import * as bs from '../../../styles/bootstrap.scss';
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
            <div className={classNames(styles.header)}>
                <div className={classNames(bs.container)}>
                    {this.headerVM.uppercaseTitle}
                </div>
            </div>
        );
    }
}