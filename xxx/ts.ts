import {plugin, Glob, FileItem} from './packer';
import * as TS from 'typescript';
import * as path from 'path';

export function ts(options: TS.CompilerOptions = {}) {
    return plugin(plug => new Promise((resolve, reject) => {
        options.outDir = plug.options.dest;
        const configFileName = (options && options.project) || TS.findConfigFile(plug.options.context, TS.sys.fileExists);
        plug.log('Using ' + configFileName);
        plug.addFileFromFS(configFileName).then(file => {
            const result = TS.parseConfigFileTextToJson(configFileName, file.content.toString());
            const configObject = result.config;
            const configParseResult = TS.parseJsonConfigFileContent(configObject, TS.sys, path.dirname(file.fullName), options, file.fullName);
            const compilerOptions = configParseResult.options;
            
            const compilerHost = TS.createCompilerHost(compilerOptions);
            compilerHost.writeFile = function (file, data) {
                plug.addDistFile(file, data);
            };
            /*
             //todo:
             compilerHost.getSourceFile = function () {
             
             };
             */
            const program = TS.createProgram(configParseResult.fileNames, compilerOptions, compilerHost);
            // First get and report any syntactic errors.
            let diagnostics = program.getSyntacticDiagnostics();
            program.getSourceFiles().forEach(file =>
                plug.addFileFromFSSync(file.fileName));
            
            // If we didn't have any syntactic errors, then also try getting the global and
            // semantic errors.
            if (diagnostics.length === 0) {
                diagnostics = program.getOptionsDiagnostics().concat(program.getGlobalDiagnostics());
                if (diagnostics.length === 0) {
                    diagnostics = program.getSemanticDiagnostics();
                }
            }
            // Otherwise, emit and report any errors we ran into.
            const emitOutput = program.emit();
            diagnostics = diagnostics.concat(emitOutput.diagnostics);
            if (diagnostics.length) {
                plug.log(diagnostics);
            }
            resolve();
        });
    }));
}