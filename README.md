# Deliberative Canvas App

**NOTE: this app is in alpha and the code is quite crude at present...it will be refactored and cleaned up as the required features and functions of the app are validated through user feedback.**

The app uses the Angular framework (and therefore TypeScript) and Earthstar for auth and storage.

As well as the below, it might also be worth checking out the [project notes](PROJECTNOTES.md) if you plan to build and host your own instance of this app.

---

## Angular

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.1.3.

#### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.


#### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.


#### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

## Earthstar

Using Earthstar v10.

But what is it!?...

> "...a small and resilient distributed storage protocol designed with a strong focus on simplicity, and the social realities of peer-to-peer computing kept in mind."

https://earthstar-project.org/docs/what-is-it

https://github.com/earthstar-project/earthstar

There is an accompanying [repository](https://github.com/uppy01/deliberative-canvas-server) available for spinning up a Deliberative Canvas "sync server", which is based on [Earthstar server](https://earthstar-project.org/docs/server-guide).

---

#### Local-First

Conceptually, this app and the underlying Earthstar infrastructure aligns with the emerging [local-first software](https://localfirstweb.dev/) movement.