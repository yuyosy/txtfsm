import { describe, expect, it } from 'vitest';
import { TxtFSM } from '../../src/txtfsm';

describe('Python regular-expression compatibility', () => {
  it('accepts an omitted lower bound in a repeat quantifier', () => {
    const template = `Value INDEX (\\d+)
Value ADDRESS (\\S+)
Start
  ^\\s{,4}\${INDEX}\\s+\${ADDRESS} -> Record`;

    expect(new TxtFSM(template).parseText('   7 192.0.2.1')).toEqual([['7', '192.0.2.1']]);
  });

  it('retains a capture followed by padding in a repeated group', () => {
    const template = `Value CAPABILITIES (\\w+)
Value PORT (\\S+)
Start
  ^Device\\s+((\${CAPABILITIES}?\\s)+)\\s*\${PORT} -> Record`;

    expect(new TxtFSM(template).parseText('Device BR          Ethernet1/1')).toEqual([
      ['BR', 'Ethernet1/1'],
    ]);
  });

  it('allows state names that start with a digit', () => {
    const template = `Value STATUS (\\w+)
Start
  ^Go -> 80211n
80211n
  ^Status: \${STATUS} -> Record`;

    expect(new TxtFSM(template).parseText('Go\nStatus: enabled')).toEqual([['enabled']]);
  });
});
