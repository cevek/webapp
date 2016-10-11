import {
    IGeneratorClass,
    UpperCamelCase,
    lowerCamelCase,
    trimLines,
    findGenTemplatesRoot,
    currentDir
} from "gen-templates";
import {relative} from "path";
import {writeFileSync, readFileSync} from 'fs';

export default class Component implements IGeneratorClass {
    help() {
        return `
            Creates something good
        `;
    }

    generator(args: {_: string[], optional: boolean}) {
        const name = args._[0];
        if (!name) {
            throw new Error("name is required");
        }
        const cls = UpperCamelCase(name);
        const lowerCase = lowerCamelCase(name);
        const dir = currentDir();
        const styleRelativePath = relative(findGenTemplatesRoot() + '/src/', `${dir}/${cls}/${cls}`);
        const testRelativePath = './' + relative(findGenTemplatesRoot(), `${dir}/${cls}/${cls}.spec`);


        function appendUnique(file: string, append: string) {
            const rootFile = findGenTemplatesRoot() + file;
            let content = readFileSync(rootFile, 'utf-8');
            if (content.indexOf(append) == -1) {
                content = content.trim() + `\n${append}\n`;
                writeFileSync(rootFile, content);
            }
        }

        appendUnique('/src/index.scss', `@import "${styleRelativePath}";`);
        appendUnique('/tests.ts', `import "${testRelativePath}";`);

        return [
            {
                filename: `${dir}/${cls}/${cls}.tsx`,
                content: trimLines(`
                    import * as React from 'react';
                    import * as classNames from 'classnames';
                    
                    interface ${cls}Props {
                        
                    }
                    
                    export class ${cls} extends React.Component<${cls}Props, {}> {
                        render() {
                            return (
                                <div className="${lowerCase}">${cls}</div>
                            );
                        }
                    }
                `)
            },
            {
                filename: `${dir}/${cls}/${cls}.scss`,
                content: trimLines(`
                    .${lowerCase} {
                        /*style*/                        
                    }
                `)
            },
            {
                filename: `${dir}/${cls}/${cls}.spec.tsx`,
                content: trimLines(`
                    import * as React from 'react';
                    import * as ReactTestUtils from 'react-addons-test-utils';
                    import {${cls}} from './${cls}';
                    
                    const renderer = ReactTestUtils.createRenderer();
                    
                    describe('${cls}', () => {
                        beforeEach(() => {
                    
                        });
                        
                        it('case1', () => {
                            renderer.render(<${cls}/>);
                            const result = renderer.getRenderOutput();
                            expect(result).toEqualJSX(
                                <div className="${lowerCase}">${cls}</div>
                            );
                        });
                    });
                `)
            }

        ]
    }
}