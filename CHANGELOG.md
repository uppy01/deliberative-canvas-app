#### Version 0.5.0 (2025.01.21)

Features
- import a csv without using pre-defined field mappings (note: json imports always require field mappings)

Bugs & Fixes
- exporting a 'date' field should not include time - just YYYY-MM-DD
- when importing csv, use source field name when field mappings do not have an export field name set
- when importing csv, any headers/fields that are not defined in the field mappings should be excluded from the export


#### Version 0.1.0 (2024.09.14)
The first (alpha) release of the Deliberative Canvas app contains the following major features:
- "adapter pipeline" for importing csv/json files from other deliberative tools, and transforming the data for display on a canvas
- pre-populated and customisable field mappings to enable interoperability with a wide range of deliberative tools
- define keywords, search and annotate imported data with those keywords
- local download and/or remote hosting of json output
    - the latter requires syncing with a [Deliberative Canvas Server](https://github.com/uppy01/deliberative-canvas-server)
- canvas manager and viewer
    - keep track of the data sources that have been added to a canvas, and display the canvas visualisation from within the app
- link a user profile (identity + data) to other browsers/devices
    - this also requires syncing with a [Deliberative Canvas Server](https://github.com/uppy01/deliberative-canvas-server) for data to be transfered.