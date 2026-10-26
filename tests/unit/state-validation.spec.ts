import { describe, expect, it } from 'vitest';
import { TxtFSM, TxtFSMTemplateError } from '../../src/index';

const INTERFACE_TEMPLATE = String.raw`Value INTERFACE (\S+)
Value LINK (up|down)
Value PROTOCOL (up|down)
Value ADDRESS (\S+)

Start
  ^${'${INTERFACE}'} is ${'${LINK}'}, line protocol is ${'${PROTOCOL}'} -> Interface

Interface
  ^\s+Internet address is ${'${ADDRESS}'} -> Record Start
  ^${'${INTERFACE}'} is ${'${LINK}'}, line protocol is ${'${PROTOCOL}'} -> Continue.Record
  ^${'${INTERFACE}'} is ${'${LINK}'}, line protocol is ${'${PROTOCOL}'} -> Inter`;

const INTERFACE_INPUT = `GigabitEthernet0/0 is up, line protocol is up
  Internet address is 192.0.2.1/24
GigabitEthernet0/1 is down, line protocol is down
  Internet address is 198.51.100.1/24
Loopback0 is up, line protocol is up`;

describe('state validation', () => {
  it('rejects an undefined target even when the input would never reach its rule', () => {
    expect(() => new TxtFSM(INTERFACE_TEMPLATE)).toThrowError(
      "State 'Inter' not found, referenced in state 'Interface'",
    );
  });

  it('accepts the declared target in the interface example', () => {
    const fsm = new TxtFSM(INTERFACE_TEMPLATE.replace(/-> Inter$/, '-> Interface'));
    expect(fsm.parseText(INTERFACE_INPUT)).toEqual([
      ['GigabitEthernet0/0', 'up', 'up', '192.0.2.1/24'],
      ['GigabitEthernet0/1', 'down', 'down', '198.51.100.1/24'],
      ['Loopback0', 'up', 'up', ''],
    ]);
  });

  it('validates targets in unreachable states', () => {
    expect(
      () => new TxtFSM('Value ITEM (\\S+)\nStart\n  ^${ITEM} -> Record\nUnused\n  ^x -> Missing'),
    ).toThrow(TxtFSMTemplateError);
  });

  it('treats Error arguments as messages rather than state names', () => {
    const fsm = new TxtFSM('Value ITEM (\\S+)\nStart\n  ^x -> Error Missing');
    expect(() => fsm.parseText('x')).toThrowError(/Missing/);
  });
});
