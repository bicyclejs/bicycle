import {StringBuilder} from '@microsoft/tsdoc';
import * as ae from '@microsoft/api-extractor';
import * as utils from './utils';
import {MarkdownEmitter} from './MarkdownEmitter';
const prettier = require('prettier');

const md = new MarkdownEmitter();
function trimLeadingWhitespace(str: string) {
  const split = str.trim().split('\n');
  let shortestIndent = null;
  for (let i = 1; i < split.length; i++) {
    const indent = /^\s*/.exec(split[i])![0];
    if (shortestIndent === null || indent.length < shortestIndent.length) {
      shortestIndent = indent;
    }
  }
  if (shortestIndent) {
    for (let i = 1; i < split.length; i++) {
      split[i] = split[i].substring(shortestIndent.length);
    }
  }
  return split.join('\n');
}
function formatType(str: string): string {
  return trimLeadingWhitespace(
    (prettier.format(`type T = ${str}`, {
      parser: 'typescript',
      printWidth: 40,
      semi: true,
      singleQuote: true,
      bracketSpacing: false,
      trailingComma: 'all',
    }) as string)
      .trim()
      .substr(`type T = `.length)
      .replace(/\;$/, ''),
  );
}
export default function printApiItem(item: ae.ApiItem, options: any): string {
  if (item instanceof ae.ApiInterface) {
    // <th><abbr title="Required">R</abbr></th>
    return [
      `<table class="interface-table"><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>`,
      `<tbody>`,
      ...item.members.map(member => {
        if (member instanceof ae.ApiPropertySignature) {
          const str = new StringBuilder();
          member.tsdocComment &&
            md.emit(str, member.tsdocComment.summarySection, {
              insideTable: true,
            });
          // const referenceIndex = member.excerptTokens
          //   .map(t => t.kind)
          //   .indexOf(ae.ExcerptTokenKind.Reference);
          // const optional =
          //   member.excerptTokens[referenceIndex + 1] &&
          //   /^\s*\?\:\s*$/.test(member.excerptTokens[referenceIndex + 1].text);
          //   <td>${
          //     optional ? '' : '✔'
          //   }</td>
          return `<tr><td><pre><code>${
            member.name
          }</code></pre></td><td><pre><code class="lang-ts">${formatType(
            member.propertyTypeExcerpt.text.replace(/\n */gm, ' '),
          )}</code></pre></td><td>${str.toString()}</td></tr>`;
        }
        console.error('Unsupported member ApiItem Type:');
        console.error(utils.serialize(member));
        return process.exit(1);
      }),
      `</tbody></table>`,
    ].join('\n');
  }
  console.error('Unsupported ApiItem Type:');
  console.error(utils.serialize(item));
  return process.exit(1);
}
