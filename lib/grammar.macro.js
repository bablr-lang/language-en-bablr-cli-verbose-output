import { i } from '@bablr/boot';
import { CoveredBy, Node, InjectFrom } from '@bablr/helpers/decorators';
import * as productions from '@bablr/helpers/productions';
import * as CSTML from '@bablr/language-en-cstml';
import * as Instruction from '@bablr/language-en-bablr-vm-instruction';
import * as Space from '@bablr/language-en-blank-space';

export const dependencies = { Space, CSTML, Instruction };

export const canonicalURL = 'https://bablr.org/languages/core/en/bablr-cli-verbose-output';

export function* eatMatchTrivia() {
  if (yield i`match(/[ \t\n]/)`) {
    return yield i`eat(#: <*Space:Space />)`;
  }
  return null;
}

export const grammar = class VerboseOutputGrammar {
  @Node
  *Output() {
    while ((yield i`match(/./)`) && (yield i`eat(lines[]: <Line />)`));
  }

  *Line() {
    yield i`eat(<Any /> [
      <ExecInstructionLine /(    )?\>\>\>/ />
      <EmitLine '<<<' />
      <EnterProductionLine '-->' />
      <LeaveProductionLine /[x<]--/ />
      <OutputLine />
    ])`;
  }

  @Node
  *ProductionName() {
    yield i`eatMatch(openBrace: <*Punctuator '[' />)`;
    yield i`eat(productionName: <*Identifier />)`;
    yield i`eatMatch(closeBrace: <*Punctuator ']' />)`;
  }

  @CoveredBy('Line')
  @Node
  *EnterProductionLine() {
    yield i`eat(sigilToken: <*Punctuator '-->' />)`;
    yield* eatMatchTrivia();
    yield i`eat(<ProductionName />)`;
    yield i`eat(lineTerminatorToken: <*Punctuator '\n' />)`;
  }

  @CoveredBy('Line')
  @Node
  *LeaveProductionLine() {
    yield i`eat(sigilToken: <*Punctuator /[<x]--/ />)`;
    yield* eatMatchTrivia();
    yield i`eat(<ProductionName />)`;
    yield i`eat(lineTerminatorToken: <*Punctuator '\n' />)`;
  }

  @CoveredBy('Line')
  @Node
  *EmitLine() {
    yield i`eat(sigilToken: <*Punctuator '<<<' />)`;
    yield* eatMatchTrivia();
    yield i`eat(expression: <CSTML:Tag />)`;
    yield i`eat(lineTerminatorToken: <*Punctuator '\n' />)`;
  }

  @CoveredBy('Line')
  @Node
  *ExecInstructionLine() {
    yield i`eatMatch(#: <*Space:Space /[ \t]+/ />)`;
    yield i`eat(sigilToken: <*Punctuator '>>>' />)`;
    yield* eatMatchTrivia();
    yield i`eat(instruction: <Instruction:Call />)`;
    yield i`eat(lineTerminatorToken: <*Punctuator '\n' />)`;
  }

  @CoveredBy('Line')
  @Node
  *OutputLine() {
    yield* eatMatchTrivia();
    yield i`eat(expressions[]: <CSTML:Tag />)`;

    yield i`eatMatch(#: <*Space:Space /[ \t]/ />)`;

    while (yield i`eatMatch(expressions[]: <CSTML:Tag />)`) {
      yield i`eatMatch(#: <*Space:Space /[ \t]/ />)`;
    }
    yield i`eat(lineTerminatorToken: <*Punctuator '\n' />)`;
  }

  @Node
  *Identifier() {
    yield i`eat(/[a-zA-Z]+/)`;
  }

  @Node
  @InjectFrom(productions)
  *Punctuator() {}

  @InjectFrom(productions)
  *Any() {}
};
