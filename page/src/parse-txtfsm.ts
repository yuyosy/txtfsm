import { TxtFSM } from '../../src/index.js';

export interface TxtFSMParseSuccess {
  readonly ok: true;
  readonly header: readonly string[];
  readonly rows: string[][];
  readonly records: Array<Record<string, string>>;
}

export interface TxtFSMParseFailure {
  readonly ok: false;
  readonly message: string;
}

export type TxtFSMParseResult = TxtFSMParseSuccess | TxtFSMParseFailure;

export function parseTxtFSM(template: string, input: string): TxtFSMParseResult {
  try {
    const fsm = new TxtFSM(template);
    const rows = fsm.parseText(input);
    const records = rows.map((row) =>
      Object.fromEntries(fsm.header.map((name, index) => [name, row[index] ?? ''])),
    );

    return { ok: true, header: fsm.header, rows, records };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
