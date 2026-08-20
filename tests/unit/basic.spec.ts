import { describe, expect, it } from 'vitest';
import { TxtFSM, TxtFSMError } from '../../src/index';

const SAMPLE_TEMPLATE = `Value HOST (\\S+)
Value INTERFACE (\\S+)
Start
  ^Host: \${HOST} -> Record
  ^Interface: \${INTERFACE} -> Record`;

const SAMPLE_INPUT = `Host: router-1
Ignored line
Interface: Gi0/1
Host: router-2
Interface: Gi0/2`;

const MULTISTATE_TEMPLATE = `Value INTERFACE (\\S+)
Value STATUS (\\S+)
Start
  ^Interface: \${INTERFACE} -> NoRecord InterfaceState
InterfaceState
  ^Status: \${STATUS} -> Record Start
  ^$ -> NoRecord Start`;

const MULTISTATE_INPUT = `Interface: Gi0/1
Status: up

Interface: Gi0/2
Status: down`;

const FILLDOWN_TEMPLATE = `Value Filldown HOST (\\S+)
Value Required INTERFACE (\\S+)
Start
  ^Host: \${HOST} -> NoRecord
  ^Interface: \${INTERFACE} -> Record
  ^Reset -> Clearall`;

const FILLDOWN_INPUT = `Host: router-1
Interface: Gi0/1
Interface: Gi0/2
Reset
Interface: Gi0/3
Host: router-2
Interface: Gi0/4`;

const FILLDOWN_CLEAR_TEMPLATE = `Value Filldown HOST (\\S+)
Value Required INTERFACE (\\S+)
Start
  ^Host: \${HOST}
  ^Reset -> Clear
  ^Interface: \${INTERFACE} -> Record`;

const FILLDOWN_CLEAR_INPUT = `Host: core-1
Interface: Eth0/0
Reset
Interface: Eth0/1`;

const FILLUP_TEMPLATE = `Value ITEM (\\S+)
Value Fillup TOTAL (\\d+)
Start
  ^Item: \${ITEM} -> Record
  ^Total: \${TOTAL}
  ^Reset -> Clearall`;

const FILLUP_INPUT = `Item: alpha
Item: beta
Total: 42
Reset
Item: gamma
Total: 100`;

const FILLUP_BOUNDARY_TEMPLATE = `Value MAP (\\S+)
Value Fillup INTERFACE (\\S+)
Start
  ^Map: \${MAP} -> Record
  ^Interface: \${INTERFACE}`;

const FILLUP_BOUNDARY_INPUT = `Map: WAN1_SEQ1
Map: WAN1_SEQ2
Interface: WAN1
Map: VPN_SEQ1
Interface: S2SVPN`;

const REQUIRED_TEMPLATE = `Value Required INTERFACE (\\S+)
Start
  ^Interface: \${INTERFACE} -> Record
  ^Commit -> Record`;

const REQUIRED_INPUT = `Commit
Interface: Gi0/1
Commit`;

const LIST_TEMPLATE = `Value INTERFACE (\\S+)
Value List VLAN (\\d+)
Start
  ^Interface: \${INTERFACE} -> NoRecord
  ^Vlan: \${VLAN} -> NoRecord
  ^Apply -> Record
  ^Clear -> Clear`;

const LIST_INPUT = `Interface: Gi0/1
Vlan: 10
Vlan: 11
Apply
Clear
Interface: Gi0/2
Apply`;

describe('TxtFSM', () => {
  it('parses simple template and input', () => {
    const fsm = new TxtFSM(SAMPLE_TEMPLATE);
    const rows = fsm.parseText(SAMPLE_INPUT);

    expect(fsm.header).toEqual(['HOST', 'INTERFACE']);
    expect(rows).toEqual([
      ['router-1', ''],
      ['', 'Gi0/1'],
      ['router-2', ''],
      ['', 'Gi0/2'],
    ]);
  });

  it('provides dictionary output', () => {
    const fsm = new TxtFSM(SAMPLE_TEMPLATE);
    const dicts = fsm.parseTextToDicts(SAMPLE_INPUT);

    expect(dicts[0]).toEqual({ HOST: 'router-1', INTERFACE: '' });
  });

  it('rejects empty templates', () => {
    expect(() => new TxtFSM(' ')).toThrowError(/empty/i);
  });

  it('supports multi-state transitions and buffered records', () => {
    const fsm = new TxtFSM(MULTISTATE_TEMPLATE);
    const rows = fsm.parseText(MULTISTATE_INPUT);

    expect(rows).toEqual([
      ['Gi0/1', 'up'],
      ['Gi0/2', 'down'],
    ]);
  });

  it('applies Filldown and Clearall semantics', () => {
    const fsm = new TxtFSM(FILLDOWN_TEMPLATE);
    const rows = fsm.parseText(FILLDOWN_INPUT);

    expect(rows).toEqual([
      ['router-1', 'Gi0/1'],
      ['router-1', 'Gi0/2'],
      ['', 'Gi0/3'],
      ['router-2', 'Gi0/4'],
    ]);
  });

  it('restores Filldown values after Clear operations', () => {
    const fsm = new TxtFSM(FILLDOWN_CLEAR_TEMPLATE);
    const rows = fsm.parseText(FILLDOWN_CLEAR_INPUT);

    expect(rows).toEqual([
      ['core-1', 'Eth0/0'],
      ['core-1', 'Eth0/1'],
    ]);
  });

  it('fills earlier and future records with Fillup values', () => {
    const fsm = new TxtFSM(FILLUP_TEMPLATE);
    const rows = fsm.parseText(FILLUP_INPUT);

    expect(rows).toEqual([
      ['alpha', '42'],
      ['beta', '42'],
      ['gamma', '100'],
    ]);
  });

  it('keeps earlier Fillup results when new values arrive', () => {
    const fsm = new TxtFSM(FILLUP_BOUNDARY_TEMPLATE);
    const rows = fsm.parseText(FILLUP_BOUNDARY_INPUT);

    expect(rows).toEqual([
      ['WAN1_SEQ1', 'WAN1'],
      ['WAN1_SEQ2', 'WAN1'],
      ['VPN_SEQ1', 'S2SVPN'],
    ]);
  });

  it('skips records when required values are missing', () => {
    const fsm = new TxtFSM(REQUIRED_TEMPLATE);
    const rows = fsm.parseText(REQUIRED_INPUT);

    expect(rows).toEqual([['Gi0/1']]);
  });

  it('collects list values across NoRecord rules', () => {
    const fsm = new TxtFSM(LIST_TEMPLATE);
    const rows = fsm.parseText(LIST_INPUT);

    expect(rows).toEqual([
      ['Gi0/1', ['10', '11']],
      ['Gi0/2', []],
    ]);

    const dictFsm = new TxtFSM(LIST_TEMPLATE);
    expect(dictFsm.parseTextToDicts(LIST_INPUT)).toEqual([
      { INTERFACE: 'Gi0/1', VLAN: ['10', '11'] },
      { INTERFACE: 'Gi0/2', VLAN: [] },
    ]);
  });

  it('keeps empty string captures in list values', () => {
    const fsm = new TxtFSM(`Value List LOCATION (.*)
Start
  ^Location: \${LOCATION} -> Record`);

    expect(fsm.parseText('Location: ')).toEqual([[['']]]);
  });

  it('retains cumulative list values when combined with Filldown', () => {
    const fsm = new TxtFSM(`Value Required ROW (\\w+)
Value List,Filldown ITEM (\\w+)
Start
  ^Item: \${ITEM} -> NoRecord
  ^Row: \${ROW} -> Record`);

    expect(fsm.parseText('Row: zero\nItem: a\nItem: b\nRow: one\nItem: c\nRow: two')).toEqual([
      ['zero', []],
      ['one', ['a', 'b']],
      ['two', ['a', 'b', 'c']],
    ]);
  });

  it('treats trailing newline like Python splitlines', () => {
    const trailingTemplate = `Value VALUE (\\S+)
Start
  ^Line: \${VALUE} -> Record
  ^# -> Next
  ^.*$ -> Error`;

    const fsm = new TxtFSM(trailingTemplate);

    expect(() => fsm.parseText('Line: foo\n')).not.toThrow();
  });

  it('still errors when extra blank lines are present', () => {
    const trailingTemplate = `Value VALUE (\\S+)
Start
  ^Line: \${VALUE} -> Record
  ^# -> Next
  ^.*$ -> Error`;

    const fsm = new TxtFSM(trailingTemplate);

    expect(() => fsm.parseText('Line: foo\n\n')).toThrow(TxtFSMError);
  });
});
