///<reference path="../node_modules/ntypescript/src/compiler/program.ts"/>

import * as ts from 'typescript';

namespace b {
    
    interface SourceFile {
        fileWatcher?: ts.FileWatcher;
    }
    
    interface Statistic {
        name: string;
        value: string;
    }
    
    const defaultFormatDiagnosticsHost: FormatDiagnosticsHost = {
        getCurrentDirectory: () => sys.getCurrentDirectory(),
        getNewLine: () => ts.sys.newLine,
        getCanonicalFileName: ts.createGetCanonicalFileName(ts.sys.useCaseSensitiveFileNames)
    };
    
    function reportDiagnostic(diagnostic: ts.Diagnostic, host: ts.FormatDiagnosticsHost) {
        // reportDiagnosticWorker(diagnostic, host || defaultFormatDiagnosticsHost);
        ts.formatDiagnostics([diagnostic], host)
    }
    
    function reportDiagnostics(diagnostics: ts.Diagnostic[], host: ts.FormatDiagnosticsHost): void {
        for (const diagnostic of diagnostics) {
            reportDiagnostic(diagnostic, host);
        }
    }
    
    function reportEmittedFiles(files: string[], host: CompilerHost): void {
        if (!files || files.length == 0) {
            return;
        }
        
        const currentDir = sys.getCurrentDirectory();
        
        for (const file of files) {
            const filepath = getNormalizedAbsolutePath(file, currentDir);
            
            sys.write(`TSFILE: ${filepath}${sys.newLine}`);
        }
    }
    
    function reportWatchDiagnostic(diagnostic: Diagnostic) {
        let output = new Date().toLocaleTimeString() + " - ";
        
        if (diagnostic.file) {
            const loc = getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
            output += `${ diagnostic.file.fileName }(${ loc.line + 1 },${ loc.character + 1 }): `;
        }
        
        output += `${ flattenDiagnosticMessageText(diagnostic.messageText, sys.newLine) }${ sys.newLine }`;
        
        sys.write(output);
    }
    
    export function executeCommandLine(args: string[]): void {
        const commandLine = ts.parseCommandLine(args);
        let configFileName: string;                                 // Configuration file name (if any)
        let cachedConfigFileText: string;                           // Cached configuration file text, used for reparsing (if any)
        let cachedProgram: ts.Program;                                 // Program cached from last compilation
        let rootFileNames: string[];                                // Root fileNames for compilation
        let compilerOptions: ts.CompilerOptions;                       // Compiler options for compilation
        let compilerHost: ts.CompilerHost;                             // Compiler host
        let hostGetSourceFile: typeof compilerHost.getSourceFile;   // getSourceFile method from default host
        
        // This map stores and reuses results of fileExists check that happen inside 'createProgram'
        // This allows to save time in module resolution heavy scenarios when existence of the same file might be checked multiple times.
        let cachedExistingFiles: Map<boolean>;
        let hostFileExists: typeof compilerHost.fileExists;
        
        
        const searchPath = ts.normalizePath(ts.sys.getCurrentDirectory());
        configFileName = ts.findConfigFile(searchPath, sys.fileExists);
        
        
        if (commandLine.options.project) {
            
            const fileOrDirectory = ts.normalizePath(commandLine.options.project);
            if (!fileOrDirectory /* current directory "." */ || sys.directoryExists(fileOrDirectory)) {
                configFileName = ts.combinePaths(fileOrDirectory, "tsconfig.json");
                if (!ts.sys.fileExists(configFileName)) {
                    reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.Cannot_find_a_tsconfig_json_file_at_the_specified_directory_Colon_0, commandLine.options.project), /* host */ undefined);
                    return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
                }
            }
            else {
                configFileName = fileOrDirectory;
                if (!ts.sys.fileExists(configFileName)) {
                    reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.The_specified_path_does_not_exist_Colon_0, commandLine.options.project), /* host */ undefined);
                    return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
                }
            }
        }
        
        performCompilation();
        
        function parseConfigFile(): ts.ParsedCommandLine {
            if (!cachedConfigFileText) {
                try {
                    cachedConfigFileText = ts.sys.readFile(configFileName);
                }
                catch (e) {
                    const error = ts.createCompilerDiagnostic(ts.Diagnostics.Cannot_read_file_0_Colon_1, configFileName, e.message);
                    reportWatchDiagnostic(error);
                    ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
                    return;
                }
            }
            const result = ts.parseConfigFileTextToJson(configFileName, cachedConfigFileText);
            const configObject = result.config;
            if (!configObject) {
                reportDiagnostics([result.error], /* compilerHost */ undefined);
                ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
                return;
            }
            const cwd = ts.sys.getCurrentDirectory();
            const configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, ts.getNormalizedAbsolutePath(ts.getDirectoryPath(configFileName), cwd), commandLine.options, ts.getNormalizedAbsolutePath(configFileName, cwd));
            if (configParseResult.errors.length > 0) {
                reportDiagnostics(configParseResult.errors, /* compilerHost */ undefined);
                ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
                return;
            }
            return configParseResult;
        }
        
        // Invoked to perform initial compilation or re-compilation in watch mode
        function performCompilation() {
            
            if (!cachedProgram) {
                if (configFileName) {
                    const configParseResult = parseConfigFile();
                    rootFileNames = configParseResult.fileNames;
                    compilerOptions = configParseResult.options;
                }
                else {
                    rootFileNames = commandLine.fileNames;
                    compilerOptions = commandLine.options;
                }
                compilerHost = ts.createCompilerHost(compilerOptions);
                hostGetSourceFile = compilerHost.getSourceFile;
                compilerHost.getSourceFile = getSourceFile;
                
                hostFileExists = compilerHost.fileExists;
                compilerHost.fileExists = cachedFileExists;
            }
            
            // reset the cache of existing files
            cachedExistingFiles = ts.createMap<boolean>();
            
            const compileResult = compile(rootFileNames, compilerOptions, compilerHost);
            
            //exit if no watch
            setCachedProgram(compileResult.program);
        }
        
        function cachedFileExists(fileName: string): boolean {
            return fileName in cachedExistingFiles
                ? cachedExistingFiles[fileName]
                : cachedExistingFiles[fileName] = hostFileExists(fileName);
        }
        
        function getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void) {
            // Return existing SourceFile object if one is available
            if (cachedProgram) {
                const sourceFile = cachedProgram.getSourceFile(fileName);
                // A modified source file has no watcher and should not be reused
                //todo
                return sourceFile;
            }
            // Use default host function
            const sourceFile = hostGetSourceFile(fileName, languageVersion, onError);
            return sourceFile;
        }
        
        // Change cached program to the given program
        function setCachedProgram(program: ts.Program) {
            if (cachedProgram) {
                const newSourceFiles = program ? program.getSourceFiles() : undefined;
                ts.forEach(cachedProgram.getSourceFiles(), sourceFile => {
                    if (!(newSourceFiles && ts.contains(newSourceFiles, sourceFile))) {
                        if (sourceFile.fileWatcher) {
                            sourceFile.fileWatcher.close();
                            sourceFile.fileWatcher = undefined;
                        }
                    }
                });
            }
            cachedProgram = program;
        }
        // If the configuration file changes, forget cached program and start the recompilation timer
        // We check if the project file list has changed. If so, we just throw away the old program and start fresh.
    }
    
    function compile(fileNames: string[], compilerOptions: CompilerOptions, compilerHost: CompilerHost) {
        const hasDiagnostics = compilerOptions.diagnostics || compilerOptions.extendedDiagnostics;
        let statistics: Statistic[];
        if (hasDiagnostics) {
            performance.enable();
            statistics = [];
        }
        
        const program = ts.createProgram(fileNames, compilerOptions, compilerHost);
        const exitStatus = compileProgram();
        
        if (compilerOptions.listFiles) {
            forEach(program.getSourceFiles(), file => {
                sys.write(file.fileName + sys.newLine);
            });
        }
        
        return {program, exitStatus};
        
        function compileProgram(): ExitStatus {
            let diagnostics: Diagnostic[];
            
            // First get and report any syntactic errors.
            diagnostics = program.getSyntacticDiagnostics();
            
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
            
            reportDiagnostics(sortAndDeduplicateDiagnostics(diagnostics), compilerHost);
            
            reportEmittedFiles(emitOutput.emittedFiles, compilerHost);
            
            if (emitOutput.emitSkipped && diagnostics.length > 0) {
                // If the emitter didn't emit anything, then pass that value along.
                return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }
            else if (diagnostics.length > 0) {
                // The emitter emitted something, inform the caller if that happened in the presence
                // of diagnostics or not.
                return ts.ExitStatus.DiagnosticsPresent_OutputsGenerated;
            }
            return ts.ExitStatus.Success;
        }
        
    }
    
    
    if (ts.sys.tryEnableSourceMapsForHost && /^development$/i.test(ts.sys.getEnvironmentVariable("NODE_ENV"))) {
        ts.sys.tryEnableSourceMapsForHost();
    }
    
    ts.executeCommandLine(ts.sys.args);
}