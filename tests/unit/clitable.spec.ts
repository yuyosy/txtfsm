import { describe, expect, it } from 'vitest';
import { CliTable, CliTableError } from '../../src/index';

const index = `Template, Hostname, Platform, Command
base.txtfsm:detail.txtfsm, .*, demo_os, sh[[ow]] it[[ems]]`;

const templates: Record<string, string> = {
  'base.txtfsm': `Value Key ID (\\d+)
Value STATE (\\w+)
Start
  ^Item \${ID} \${STATE} -> Record`,
  'detail.txtfsm': `Value Key ID (\\d+)
Value STATE (\\w+)
Value DESCRIPTION (.+)
Start
  ^Detail \${ID} \${DESCRIPTION} -> Record`,
};

describe('CliTable', () => {
  it('selects abbreviated commands and merges templates by Key', () => {
    const table = new CliTable(index, (name) => templates[name]);
    expect(
      table.parseCmd('Item 1 up\nDetail 1 WAN uplink\nDetail 1 ignored duplicate', {
        Platform: 'demo_os',
        Command: 'show items',
      }),
    ).toEqual([{ ID: '1', STATE: 'up', DESCRIPTION: 'WAN uplink' }]);
  });

  it('drops secondary rows whose keys are absent from the first table', () => {
    const table = new CliTable(index, (name) => templates[name]);
    expect(
      table.parseCmd('Item 1 up\nDetail 2 unused', {
        Platform: 'demo_os',
        Command: 'sh it',
      }),
    ).toEqual([{ ID: '1', STATE: 'up', DESCRIPTION: '' }]);
  });

  it('throws when no index row matches', () => {
    const table = new CliTable(index, (name) => templates[name]);
    expect(() => table.parseCmd('', { Platform: 'other', Command: 'show items' })).toThrow(
      CliTableError,
    );
  });
});
