- Earthstar package wouldn't install using node v22.5.1 (problem installing better-sqlite3 dependency) - got it installed using v.21.5.0
- need to npm install "@types/papaparse" to work with TypeScript (non-negotiable if in TS strict mode, however I've turned this off)
- to avoid errors and warnings when running and using output of "ng build", need to add the following...
    - ignore the dependency on node.js 'crypto' library
        - in package.json - `"browser": { "crypto": false }`
    - allowedCommonJsDependencies in angular.json
- boostrap gotcha's
    - referencing bootstrap classes in javascript messes with dropdowns, popovers etc - https://github.com/twbs/bootstrap/issues/32749

