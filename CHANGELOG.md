# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


[Unreleased]
- Refer to the GitHub main branch for the latest changes after release.


## [0.2.0] - 2026-08-25

### Fixed
- Preserved `Value List` results as string arrays across parser APIs and `CliTable` output instead of flattening them into comma-delimited strings.
- Updated tests and documentation so list-valued parser results are validated and described consistently.

### Added
- Added a documentation and playground site with getting started guides, live parsing examples, and API reference pages.
- Added browser and Node.js examples that show how to load raw template text from textarea values or `.textfsm` files.


## [0.1.0] - 2026-08-16

### Added

- First release of the txtfsm package, providing a TextFSM template parser for JavaScript.
- Implemented based on TextFSM v2.1.0 (Apache-2.0 License).
