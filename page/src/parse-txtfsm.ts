import { TxtFSM } from '../../src/index.js';
import type { TextFSMRecord, TextFSMRow } from '../../src/index.js';

export interface TxtFSMParseSuccess {
  readonly ok: true;
  readonly header: readonly string[];
  readonly rows: TextFSMRow[];
  readonly records: TextFSMRecord[];
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
    const records = rows.map((row) => {
      const record: TextFSMRecord = {};
      fsm.header.forEach((name, index) => {
        record[name] = row[index] ?? '';
      });
      return record;
    });

    return { ok: true, header: fsm.header, rows, records };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
