import { describe, expect, it } from 'vitest';
import { TxtFSM } from '../../src/txtfsm';

const VIRTUAL_EOF = `Value VERSION (\\S+)
Start
  ^Version: \${VERSION}
  ^Done -> EOF`;

describe('EOF behavior', () => {
  it('records buffered values after a transition to virtual EOF', () => {
    expect(new TxtFSM(VIRTUAL_EOF).parseText('Version: 1.2.3\nDone')).toEqual([['1.2.3']]);
  });

  it('suppresses the implicit record when eof is false', () => {
    expect(
      new TxtFSM(VIRTUAL_EOF).parseText('Version: 1.2.3\nDone', {
        eof: false,
      }),
    ).toEqual([]);
  });

  it('suppresses the implicit record for an explicit EOF state', () => {
    const template = `${VIRTUAL_EOF}
EOF`;
    expect(new TxtFSM(template).parseText('Version: 1.2.3\nDone')).toEqual([]);
  });

  it('suppresses the implicit record after End', () => {
    const template = VIRTUAL_EOF.replace('-> EOF', '-> End');
    expect(new TxtFSM(template).parseText('Version: 1.2.3\nDone')).toEqual([]);
  });
});
