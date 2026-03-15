import { re, spam as m } from '@bablr/boot';
import { eat, eatMatch, match } from '@bablr/helpers/grammar';
import CSTML from '@bablr/language-en-cstml';
import Instruction from '@bablr/language-en-bablr-vm-instruction';
import Space from '@bablr/language-en-blank-space';
import { printSource } from '@bablr/agast-helpers/tree';

export const canonicalURL = 'https://bablr.org/languages/core/en/bablr-cli-verbose-output';

export const dependencies = { Space, CSTML, Instruction };

export const defaultMatcher = m`<Output />`;

export function* eatMatchTrivia() {
  if (yield match(re`/[ \t\n]/`)) {
    return yield eat(m`#: :Space: <*Space />`);
  }
  return null;
}

export const grammar = class VerboseOutputGrammar {
  *Output() {
    while ((yield match(re`/./`)) && (yield eat(m`lines[]$: <_Line />`)));
  }

  *Line() {
    let res = yield match(re`/(?:    )?[>]{3}|[<]{3}|--[>]|[x<]--/`);

    switch (printSource(res)) {
      case '<<<':
        yield eat(m`<EmitLine />`);
        break;
      case '>>>':
      case '    >>>':
        yield eat(m`<ExecInstructionLine />`);
        break;
      case '-->':
        yield eat(m`<EnterProductionLine />`);
        break;
      case '<--':
      case 'x--':
        yield eat(m`<LeaveProductionLine />`);
        break;
      default:
        yield eat(m`<OutputLine />`);
        break;
    }
  }

  *ProductionName() {
    if (yield eatMatch(m`value: <* '_' />`)) {
    } else {
      yield eat(m`value: :CSTML: <Identifier />`);
    }
  }

  *EnterProductionLine() {
    yield eat(m`sigilToken: <* '-->' />`);
    yield* eatMatchTrivia();
    yield eat(m`name: <ProductionName />`);
    yield eat(m`lineTerminatorToken: <* '\n' />`);
  }

  *LeaveProductionLine() {
    yield eat(m`sigilToken: <* /[<x]--/ />`);
    yield* eatMatchTrivia();
    yield eat(m`name: <ProductionName />`);
    yield eat(m`lineTerminatorToken: <* '\n' />`);
  }

  *EmitLine() {
    yield eat(m`sigilToken: <* '<<<' />`);
    yield* eatMatchTrivia();
    yield eat(m`expression: :CSTML: <_Tag />`);
    yield eat(m`lineTerminatorToken: <* '\n' />`);
  }

  *ExecInstructionLine() {
    yield eatMatch(m`#: :Space: <*Space /[ \t]+/ />`);
    yield eat(m`sigilToken: <* '>>>' />`);
    yield* eatMatchTrivia();
    yield eat(m`instruction: :Instruction: <Call />`);
    yield eat(m`lineTerminatorToken: <* '\n' />`);
  }

  *OutputLine() {
    yield* eatMatchTrivia();
    yield eat(m`expressions[]: :CSTML: <_Tag />`);

    yield eatMatch(m`#: :Space: <*Space /[ \t]/ />`);

    while (yield eatMatch(m`expressions[]: :CSTML: <_Tag /./ />`)) {
      yield eatMatch(m`#: :Space: <*Space /[ \t]/ />`);
    }
    yield eat(m`lineTerminatorToken: <* '\n' />`);
  }
};

export default { canonicalURL, dependencies, grammar, defaultMatcher };
