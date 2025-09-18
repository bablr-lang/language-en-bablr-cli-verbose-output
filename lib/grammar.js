import { re, spam as m } from '@bablr/boot';
import { eat, eatMatch, match } from '@bablr/helpers/grammar';
import * as CSTML from '@bablr/language-en-cstml';
import * as Instruction from '@bablr/language-en-bablr-vm-instruction';
import * as Space from '@bablr/language-en-blank-space';

export const dependencies = { Space, CSTML, Instruction };

export const canonicalURL = 'https://bablr.org/languages/core/en/bablr-cli-verbose-output';

export const defaultMatcher = m`<Output />`;

export function* eatMatchTrivia() {
  if (yield match(re`/[ \t\n]/`)) {
    return yield eat(m`#: :Space: <*Space />`);
  }
  return null;
}

export const grammar = class VerboseOutputGrammar {
  constructor() {
    this.literals = new Set(['Punctuator']);
  }

  *Output() {
    while ((yield match(re`/./`)) && (yield eat(m`lines[]: <_Line />`)));
  }

  *Line() {
    if (yield eatMatch(m`<ExecInstructionLine /(?:    )?\>\>\>/ />`)) {
    } else if (yield eatMatch(m`<EmitLine '<<<' />`)) {
    } else if (yield eatMatch(m`<EnterProductionLine '-->' />`)) {
    } else if (yield eatMatch(m`<LeaveProductionLine /[x<]--/ />`)) {
    } else {
      yield eatMatch(m`<OutputLine /./s />`);
    }
  }

  *ProductionName() {
    if (yield eatMatch(m`value: <*Punctuator '_' />`)) {
    } else {
      yield eat(m`value: :CSTML: <Identifier />`);
    }
  }

  *EnterProductionLine() {
    yield eat(m`sigilToken: <*Punctuator '-->' />`);
    yield* eatMatchTrivia();
    yield eat(m`name: <ProductionName />`);
    yield eat(m`lineTerminatorToken: <*Punctuator '\n' />`);
  }

  *LeaveProductionLine() {
    yield eat(m`sigilToken: <*Punctuator /[<x]--/ />`);
    yield* eatMatchTrivia();
    yield eat(m`name: <ProductionName />`);
    yield eat(m`lineTerminatorToken: <*Punctuator '\n' />`);
  }

  *EmitLine() {
    yield eat(m`sigilToken: <*Punctuator '<<<' />`);
    yield* eatMatchTrivia();
    yield eat(m`expression: :CSTML: <_Tag />`);
    yield eat(m`lineTerminatorToken: <*Punctuator '\n' />`);
  }

  *ExecInstructionLine() {
    yield eatMatch(m`#: :Space: <*Space /[ \t]+/ />`);
    yield eat(m`sigilToken: <*Punctuator '>>>' />`);
    yield* eatMatchTrivia();
    yield eat(m`instruction: :Instruction: <Call />`);
    yield eat(m`lineTerminatorToken: <*Punctuator '\n' />`);
  }

  *OutputLine() {
    yield* eatMatchTrivia();
    yield eat(m`expressions[]: :CSTML: <_Tag />`);

    yield eatMatch(m`#: :Space: <*Space /[ \t]/ />`);

    while (yield eatMatch(m`expressions[]: :CSTML: <_Tag />`)) {
      yield eatMatch(m`#: :Space: <*Space /[ \t]/ />`);
    }
    yield eat(m`lineTerminatorToken: <*Punctuator '\n' />`);
  }
};
