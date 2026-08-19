# Changelog

## [1.3.0](https://github.com/YunosukeYoshino/google-apps-script-starter/compare/v1.2.3...v1.3.0) (2026-08-19)


### Features

* add optional Gemini Spark MCP adapter ([c200360](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/c20036054b915d3f55c5f0428e3018f4b617dc39))
* add Spreadsheet MCP sample app ([13e7760](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/13e7760c5c7353628e19e27f53ec5d47ab54203c))
* **sample:** add client-side sendContactForm utility ([895a938](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/895a93810ea465874f5cd4fd2acc56f9b80fbfe6))
* **sample:** add Cloudflare Turnstile verification to contact-api ([f631d6e](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/f631d6ea7dfb600ceb34a223c19721fd99424123))
* **sample:** add contact-api sample app with test UI and documentation ([f0305d7](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/f0305d7222f93c531b72eb736803fcfdafe38b8e))
* **sample:** add doGet health check endpoint in contact-api ([8266b47](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/8266b470c223822b7fab7310d48599a12207318e))
* **sample:** add honeypot spam protection in contact-api ([ae17065](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/ae17065e8db4d1c75f12b6ea6dc72e41f4e66e87))
* **sample:** add request validation to doPost in contact-api ([b52e886](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/b52e8867d785b2eb2bf3caac5799061a4e2ceea1))
* **sample:** implement spreadsheet logging and email notifications in contact-api ([5119d06](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/5119d0666e9c358767e6573406ad317e4b3efb02))


### Bug Fixes

* align clasp 3.3.0 commands in docs and CLI scaffolding ([0ad52c1](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/0ad52c1f364e24bdcc1aed61addfbdbf3bb7b99a))
* expose setupMcp in template and align MCP setup docs ([fcc2e69](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/fcc2e6971fd762dd1931144d7b727e827acdc708))
* make setupMcp runnable from the Apps Script editor ([dc19d5c](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/dc19d5c93fd3860d4bbb15e6d7e440983aa54662))
* **sample:** improve URL placeholder validation and guidance in test UI ([f4ca6a7](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/f4ca6a7d34d2af65105ce2f2734f84d745258bd3))
* **sample:** set webapp access to ANYONE_ANONYMOUS and support POST ping health check ([d4b2dee](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/d4b2deed151f5297d6b9906396403f71528fa87c))

## [1.2.3](https://github.com/YunosukeYoshino/google-apps-script-starter/compare/v1.2.2...v1.2.3) (2026-08-10)


### Bug Fixes

* clarify that .clasp.json is generated, not part of scaffold ([469aa76](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/469aa76ee73fb1d4b897f439ec64ddbadfed230b))

## [1.2.2](https://github.com/YunosukeYoshino/google-apps-script-starter/compare/v1.2.1...v1.2.2) (2026-08-10)


### Bug Fixes

* include lint configs in npm package and correct docs drift ([ab60212](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/ab6021239d5bdca808d029bcc6f9d5e4bf9f0699))

## [1.2.1](https://github.com/YunosukeYoshino/google-apps-script-starter/compare/v1.2.0...v1.2.1) (2026-08-10)


### Bug Fixes

* use webapp type in clasp create command to match webapp manifest ([598778d](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/598778d1eccd68cd6d85e775d8c846456c719560))

## [1.2.0](https://github.com/YunosukeYoshino/google-apps-script-starter/compare/v1.1.1...v1.2.0) (2026-08-10)


### Features

* add runnable gas web app sample ([3da206e](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/3da206e4ee761f93ea57ab7d72575f510a8c216e))
* **sample:** React + shadcn/ui (Base UI) 構成へ移行 ([dfc9759](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/dfc975927371b8b6e2da3ce0f95fa621a8aad790))
* **template:** React + shadcn/ui (Base UI) 構成へ移行 ([2d9159e](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/2d9159e27a0ca49d52f42c7a821b1d66e099a7a1))


### Bug Fixes

* force clasp push for untracked files ([2bd8d6f](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/2bd8d6f61f39dc9722dbf6bab4ee57211e19b692))
* make template and sample bun workspaces to fix CI typecheck ([0d51091](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/0d51091b08b9cbb9ff99ad9af080c44f10af9ddb))

## [1.1.1](https://github.com/YunosukeYoshino/google-apps-script-starter/compare/v1.1.0...v1.1.1) (2026-08-10)


### Bug Fixes

* **release:** install dependencies before npm publish ([c3091c7](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/c3091c7b7a91f8426a8eb3c160b695f809af148b))

## [1.1.0](https://github.com/YunosukeYoshino/google-apps-script-starter/compare/v1.0.0...v1.1.0) (2026-08-10)


### Features

* render serverTime via GAS template scriptlet ([5d22ae6](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/5d22ae6d0e0b24dd3a4a39a8083c5d8b835a5c5a))


### Bug Fixes

* add DOM lib to tsconfig and enforce typecheck in CI ([2f6fc97](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/2f6fc97a4a15129c13870c645444d8f58ff2d4b4))
* place server-time element as sibling of #app per plan ([91134a9](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/91134a9e98b82622bbf002d08e1e44446de6962d))
* publish to npm from release-please workflow ([cd5fb98](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/cd5fb98b6f6a6b8b9507611ca1a060d683928a72))
* publish to npm from release-please workflow. ([9e475d2](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/9e475d22a2aac9137dc90ba0acc0e382ef856b5a))
* remove dangling main field ([739e0b8](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/739e0b881610a081c318867d434ce1c4cf892f52))
* typecheck gate, serverTime rendering, lockfile reproducibility, packaging metadata ([4769682](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/4769682ad28d727dc47e6abbd6c02424f54bf509))

## 1.0.0 (2026-05-27)


### Features

* add CI/release automation and migrate scaffold CLI to Bun TypeScript. ([324ca98](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/324ca98651d0d044c22a8a06034b414c58c76edc))
* add CLI script for npx support and prepare for npm publishing ([4c76eaf](https://github.com/YunosukeYoshino/google-apps-script-starter/commit/4c76eafad8d2fc6a788a6815ae74db6d558f11b7))
