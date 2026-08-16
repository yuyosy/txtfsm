# External Directory

This directory contains external dependencies and resources for the project.

This includes the following:
- `ntc-templates`: Network Test Cases templates used by the project.
  - Templates and test cases are fetched from the tagged GitHub Source code archive using the `scripts/fetch-ntc-templates.mjs` script.
  - The tag and SHA-256 checksum are pinned in `ntc-templates.lock.json`.
  - An existing installation is reused when its `.textfsm-ts-source.json` matches the lock file.
  - ntc-templates is licensed under the Apache License, Version 2.0.
  - [ntc-templates](https://github.com/networktocode/ntc-templates)

## YAML Compatibility

Some upstream `ntc-templates` fixtures use loose YAML formatting, including
indentation that newer `js-yaml` releases reject. Compatibility tests use
`js-yaml` 4.3.0 because it accepts these fixtures. Do not upgrade `js-yaml`
without first normalizing the affected upstream fixtures or providing an
equivalent compatibility layer.
