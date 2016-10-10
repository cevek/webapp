export function makeIndex(params: {title: string, body: string, javascript: string[], styles: string[]}) {
    return `
<!doctype html>
<html>
<head>
<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${params.title}</title>
    ${params.styles.map(style => `\t<link href="${style}" rel="stylesheet">\n`)}
</head>
<body>
    <div id="wrapper">${params.body}</div>
    ${params.javascript.map(js => `<script src="${js}"></script>`)}
</body>
</html>
`
}