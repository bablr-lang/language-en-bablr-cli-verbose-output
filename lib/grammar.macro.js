import { i, re, spam as m } from '@bablr/boot';
import { CoveredBy, Node, InjectFrom, Literal } from '@bablr/helpers/decorators';
import { o, eat, eatMatch, match } from '@bablr/helpers/grammar';
import * as productions from '@bablr/helpers/productions';
import * as CSTML from '@bablr/language-en-cstml';
import * as Instruction from '@bablr/language-en-bablr-vm-instruction';
import * as Space from '@bablr/language-en-blank-space';

export const type = Symbol.for('@bablr/language');

export const dependencies = { Space, CSTML, Instruction };

export const canonicalURL = 'https://bablr.org/languages/core/en/bablr-cli-verbose-output';

export function* eatMatchTrivia() {
  if (yield match(re`/[ \t\n]/`)) {
    return yield eat(m`#: <*Space:Space />`);
  }
  return null;
}

export const grammar = class VerboseOutputGrammar {
  @Node
  *Output() {
    while ((yield match(re`/./`)) && (yield eat(m`lines[]: <__Line />`)));
  }

  *Line() {
    yield eat(m`<_Any />`, [
      m`<ExecInstructionLine /(    )?\>\>\>/ />`,
      m`<EmitLine '<<<' />`,
      m`<EnterProductionLine '-->' />`,
      m`<LeaveProductionLine /[x<]--/ />`,
      m`<OutputLine />`,
    ]);
  }

  @Node
  *ProductionName() {
    yield eatMatch(m`openBrace: <*Punctuator '[' />`);
    yield eat(m`productionName: <*Identifier />`);
    yield eatMatch(m`closeBrace: <*Punctuator ']' />`);
  }

  @CoveredBy('Line')
  @Node
  *EnterProductionLine() {
    yield eat(m`sigilToken: <*Punctuator '-->' />`);
    yield* eatMatchTrivia();
    yield eat(m`name: <ProductionName />`);
    yield eat(m`lineTerminatorToken: <*Punctuator '\n' />`);
  }

  @CoveredBy('Line')
  @Node
  *LeaveProductionLine() {
    yield eat(m`sigilToken: <*Punctuator /[<x]--/ />`);
    yield* eatMatchTrivia();
    yield eat(m`name: <ProductionName />`);
    yield eat(m`lineTerminatorToken: <*Punctuator '\n' />`);
  }

  @CoveredBy('Line')
  @Node
  *EmitLine() {
    yield eat(m`sigilToken: <*Punctuator '<<<' />`);
    yield* eatMatchTrivia();
    yield eat(m`expression: <__CSTML:Tag />`);
    yield eat(m`lineTerminatorToken: <*Punctuator '\n' />`);
  }

  @CoveredBy('Line')
  @Node
  *ExecInstructionLine() {
    yield eatMatch(m`#: <*Space:Space /[ \t]+/ />`);
    yield eat(m`sigilToken: <*Punctuator '>>>' />`);
    yield* eatMatchTrivia();
    yield eat(m`instruction: <Instruction:Call />`);
    yield eat(m`lineTerminatorToken: <*Punctuator '\n' />`);
  }

  @CoveredBy('Line')
  @Node
  *OutputLine() {
    yield* eatMatchTrivia();
    // yield i`eat(m'expressions[]: <__CSTML:Tag />')`;
    yield eat(m`expressions[]: <__CSTML:Tag />`);

    yield eatMatch(m`#: <*Space:Space /[ \t]/ />`);

    while (yield eatMatch(m`expressions[]: <__CSTML:Tag />`)) {
      yield eatMatch(m`#: <*Space:Space /[ \t]/ />`);
    }
    yield eat(m`lineTerminatorToken: <*Punctuator '\n' />`);
  }

  @Node
  *Identifier() {
    yield eat(re`/[a-zA-Z]+/`);
  }

  @Literal
  @Node
  @InjectFrom(productions)
  *Punctuator() {}

  @InjectFrom(productions)
  *Any() {}
};
