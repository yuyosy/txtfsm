import type { LanguageRegistration } from 'shiki/core';

export const txtfsmLanguage: LanguageRegistration = {
  name: 'txtfsm',
  displayName: 'TextFSM Template',
  scopeName: 'source.txtfsm',
  aliases: ['textfsm'],
  repository: {},
  patterns: [
    { match: '^\\s*#.*$', name: 'comment.line.number-sign.txtfsm' },
    {
      match:
        '^(\\s*)(Value)(?:\\s+((?:Filldown|Fillup|Key|List|Required)(?:\\s*,\\s*(?:Filldown|Fillup|Key|List|Required))*))?\\s+([A-Za-z_][A-Za-z0-9_]*)',
      captures: {
        2: { name: 'keyword.declaration.txtfsm' },
        3: { name: 'storage.modifier.txtfsm' },
        4: { name: 'variable.other.definition.txtfsm' },
      },
    },
    {
      match: '^([A-Za-z_][A-Za-z0-9_-]*)(?=\\s*$)',
      captures: { 1: { name: 'entity.name.type.state.txtfsm' } },
    },
    { match: '\\$\\{[A-Za-z_][A-Za-z0-9_]*\\}', name: 'variable.other.txtfsm' },
    { match: '(->)', name: 'keyword.operator.arrow.txtfsm' },
    {
      match: '\\b(Continue|Next|Record|NoRecord|Clear|Clearall|Error)\\b',
      name: 'support.function.action.txtfsm',
    },
    { match: '\\b(Start|EOF|End)\\b', name: 'constant.language.state.txtfsm' },
    { match: '\\\\[AbBdDsSwWZ]|\\\\.|\\[[^\\]]*\\]|[(){}+*?^$|.]', name: 'string.regexp.txtfsm' },
  ],
};
