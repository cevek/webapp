"use strict";
var gen_templates_1 = require("gen-templates");
var path_1 = require("path");
var fs_1 = require('fs');
var Component = (function () {
    function Component() {
    }
    Component.prototype.help = function () {
        return "\n            Creates something good\n        ";
    };
    Component.prototype.generator = function (args) {
        var name = args._[0];
        if (!name) {
            throw new Error("name is required");
        }
        var cls = gen_templates_1.UpperCamelCase(name);
        var lowerCase = gen_templates_1.lowerCamelCase(name);
        var dir = gen_templates_1.currentDir();
        var styleRelativePath = path_1.relative(gen_templates_1.findGenTemplatesRoot() + '/src/', dir + "/" + cls + "/" + cls);
        var testRelativePath = './' + path_1.relative(gen_templates_1.findGenTemplatesRoot(), dir + "/" + cls + "/" + cls + ".spec");
        function appendUnique(file, append) {
            var rootFile = gen_templates_1.findGenTemplatesRoot() + file;
            var content = fs_1.readFileSync(rootFile, 'utf-8');
            if (content.indexOf(append) == -1) {
                content = content.trim() + ("\n" + append + "\n");
                fs_1.writeFileSync(rootFile, content);
            }
        }
        appendUnique('/src/index.scss', "@import \"" + styleRelativePath + "\";");
        appendUnique('/tests.ts', "import \"" + testRelativePath + "\";");
        return [
            {
                filename: dir + "/" + cls + "/" + cls + ".tsx",
                content: gen_templates_1.trimLines("\n                    import * as React from 'react';\n                    import * as classNames from 'classnames';\n                    \n                    interface " + cls + "Props {\n                        \n                    }\n                    \n                    export class " + cls + " extends React.Component<" + cls + "Props, {}> {\n                        render() {\n                            return (\n                                <div className=\"" + lowerCase + "\">" + cls + "</div>\n                            );\n                        }\n                    }\n                ")
            },
            {
                filename: dir + "/" + cls + "/" + cls + ".scss",
                content: gen_templates_1.trimLines("\n                    ." + lowerCase + " {\n                        /*style*/                        \n                    }\n                ")
            },
            {
                filename: dir + "/" + cls + "/" + cls + ".spec.tsx",
                content: gen_templates_1.trimLines("\n                    import * as React from 'react';\n                    import * as ReactTestUtils from 'react-addons-test-utils';\n                    import {" + cls + "} from './" + cls + "';\n                    \n                    const renderer = ReactTestUtils.createRenderer();\n                    \n                    describe('" + cls + "', () => {\n                        beforeEach(() => {\n                    \n                        });\n                        \n                        it('case1', () => {\n                            renderer.render(<" + cls + "/>);\n                            const result = renderer.getRenderOutput();\n                            expect(result).toEqualJSX(\n                                <div className=\"" + lowerCase + "\">" + cls + "</div>\n                            );\n                        });\n                    });\n                ")
            }
        ];
    };
    return Component;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Component;
