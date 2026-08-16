/*
 * SPDX-License-Identifier: Apache-2.0
 * Derived from TextFSM source code:
 * Copyright 2010, 2011, 2012, 2022 Google Inc. All Rights Reserved.
 *
 * Modified and translated to TypeScript for TxtFSM.
 */

export class TxtFSMError extends Error {
  readonly code: string;

  constructor(message: string, code: string = 'FSM_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export class TxtFSMTemplateError extends TxtFSMError {
  constructor(message: string) {
    super(message, 'TEMPLATE');
  }
}

export class UsageError extends TxtFSMError {
  constructor(message: string) {
    super(message, 'USAGE');
  }
}

export class SkipRecord extends Error {
  constructor(message: string = 'Skip record') {
    super(message);
    this.name = 'SkipRecord';
  }
}
