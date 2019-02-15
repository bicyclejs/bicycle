// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

// source: https://github.com/Microsoft/web-build-tools/blob/e8999524a772e9053e443d9056c88798ba35327f/apps/api-documenter/src/markdown/MarkdownEmitter.ts
// slightly modified because I actually want to output html

import {
  DocNode,
  DocNodeKind,
  StringBuilder,
  DocPlainText,
  DocHtmlStartTag,
  DocHtmlEndTag,
  DocCodeSpan,
  DocLinkTag,
  DocParagraph,
  DocFencedCode,
  DocSection,
  DocNodeTransforms,
  DocEscapedText,
  DocErrorText,
  DocBlockTag,
} from '@microsoft/tsdoc';
import {IndentedWriter} from '@microsoft/api-extractor';

export interface IMarkdownEmitterContext {
  writer: IndentedWriter;
  insideTable: boolean;

  boldRequested: boolean;
  italicRequested: boolean;

  writingBold: boolean;
  writingItalic: boolean;

  // options: TOptions;
}

/**
 * Renders MarkupElement content in the Markdown file format.
 * For more info:  https://en.wikipedia.org/wiki/Markdown
 */
export class MarkdownEmitter {
  public emit(
    stringBuilder: StringBuilder,
    docNode: DocNode,
    options: Partial<IMarkdownEmitterContext>,
  ): string {
    const writer: IndentedWriter = new IndentedWriter(stringBuilder);

    const context: IMarkdownEmitterContext = {
      writer,
      insideTable: false,

      boldRequested: false,
      italicRequested: false,

      writingBold: false,
      writingItalic: false,

      ...options,
    };

    this.writeNode(docNode, context, false);

    writer.ensureNewLine(); // finish the last line

    return writer.toString();
  }

  protected getEscapedText(text: string): string {
    const textWithBackslashes: string = text
      .replace(/\\/g, '\\\\') // first replace the escape character
      .replace(/[*#[\]_|`~]/g, x => '\\' + x) // then escape any special characters
      .replace(/---/g, '\\-\\-\\-') // hyphens only if it's 3 or more
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return textWithBackslashes;
  }

  /**
   * @virtual
   */
  protected writeNode(
    docNode: DocNode,
    context: IMarkdownEmitterContext,
    docNodeSiblings: boolean,
  ): void {
    const writer: IndentedWriter = context.writer;

    switch (docNode.kind) {
      case DocNodeKind.PlainText: {
        const docPlainText: DocPlainText = docNode as DocPlainText;
        this.writePlainText(docPlainText.text, context);
        break;
      }
      case DocNodeKind.HtmlStartTag:
      case DocNodeKind.HtmlEndTag: {
        const docHtmlTag: DocHtmlStartTag | DocHtmlEndTag = docNode as
          | DocHtmlStartTag
          | DocHtmlEndTag;
        // write the HTML element verbatim into the output
        writer.write(docHtmlTag.emitAsHtml());
        break;
      }
      case DocNodeKind.CodeSpan: {
        const docCodeSpan: DocCodeSpan = docNode as DocCodeSpan;
        writer.write('<code>');
        if (context.insideTable) {
          const parts: string[] = docCodeSpan.code.split(/\r?\n/g);
          writer.write(parts.join('`<p/>`'));
        } else {
          writer.write(docCodeSpan.code);
        }
        writer.write('</code>');
        break;
      }
      case DocNodeKind.LinkTag: {
        const docLinkTag: DocLinkTag = docNode as DocLinkTag;
        if (docLinkTag.codeDestination) {
          this.writeLinkTagWithCodeDestination(docLinkTag, context);
        } else if (docLinkTag.urlDestination) {
          this.writeLinkTagWithUrlDestination(docLinkTag, context);
        } else if (docLinkTag.linkText) {
          this.writePlainText(docLinkTag.linkText, context);
        }
        break;
      }
      case DocNodeKind.Paragraph: {
        const docParagraph: DocParagraph = docNode as DocParagraph;
        const trimmedParagraph: DocParagraph = DocNodeTransforms.trimSpacesInParagraph(
          docParagraph,
        );
        if (context.insideTable) {
          if (docNodeSiblings) {
            writer.write('<p>');
            this.writeNodes(trimmedParagraph.nodes, context);
            writer.write('</p>');
          } else {
            // Special case:  If we are the only element inside this table cell, then we can omit the <p></p> container.
            this.writeNodes(trimmedParagraph.nodes, context);
          }
        } else {
          this.writeNodes(trimmedParagraph.nodes, context);
          writer.ensureNewLine();
          writer.writeLine();
        }
        break;
      }
      case DocNodeKind.FencedCode: {
        const docFencedCode: DocFencedCode = docNode as DocFencedCode;
        writer.ensureNewLine();
        writer.write('```');
        writer.write(docFencedCode.language);
        writer.writeLine();
        writer.write(docFencedCode.code);
        writer.writeLine();
        writer.writeLine('```');
        break;
      }
      case DocNodeKind.Section: {
        const docSection: DocSection = docNode as DocSection;
        this.writeNodes(docSection.nodes, context);
        break;
      }
      case DocNodeKind.SoftBreak: {
        if (!/^\s?$/.test(writer.peekLastCharacter())) {
          writer.write(' ');
        }
        break;
      }
      case DocNodeKind.EscapedText: {
        const docEscapedText: DocEscapedText = docNode as DocEscapedText;
        this.writePlainText(docEscapedText.decodedText, context);
        break;
      }
      case DocNodeKind.ErrorText: {
        const docErrorText: DocErrorText = docNode as DocErrorText;
        this.writePlainText(docErrorText.text, context);
        break;
      }
      case DocNodeKind.InlineTag: {
        break;
      }
      case DocNodeKind.BlockTag: {
        context.writer.write('<b>');
        this.writePlainText((docNode as DocBlockTag).tagName, context);
        context.writer.write('</b>');
        // TODO
        break;
      }
      default:
        throw new Error('Unsupported element kind: ' + docNode.kind);
    }
  }

  /** @virtual */
  protected writeLinkTagWithCodeDestination(
    docLinkTag: DocLinkTag,
    context: IMarkdownEmitterContext,
  ): void {
    // The subclass needs to implement this to support code destinations
    throw new Error('writeLinkTagWithCodeDestination()');
  }

  /** @virtual */
  protected writeLinkTagWithUrlDestination(
    docLinkTag: DocLinkTag,
    context: IMarkdownEmitterContext,
  ): void {
    const linkText: string =
      docLinkTag.linkText !== undefined
        ? docLinkTag.linkText
        : docLinkTag.urlDestination!;

    const encodedLinkText: string = this.getEscapedText(
      linkText.replace(/\s+/g, ' '),
    );

    context.writer.write('[');
    context.writer.write(encodedLinkText);
    context.writer.write(`](${docLinkTag.urlDestination!})`);
  }

  protected writePlainText(
    text: string,
    context: IMarkdownEmitterContext,
  ): void {
    const writer: IndentedWriter = context.writer;

    // split out the [ leading whitespace, content, trailing whitespace ]
    const parts: string[] = text.match(/^(\s*)(.*?)(\s*)$/) || [];

    writer.write(parts[1]); // write leading whitespace

    const middle: string = parts[2];

    if (middle !== '') {
      switch (writer.peekLastCharacter()) {
        case '':
        case '\n':
        case ' ':
        case '[':
        case '>':
          // okay to put a symbol
          break;
        default:
          // This is no problem:        "**one** *two* **three**"
          // But this is trouble:       "**one***two***three**"
          // The most general solution: "**one**<!-- -->*two*<!-- -->**three**"
          writer.write('<!-- -->');
          break;
      }

      if (context.boldRequested) {
        writer.write('<b>');
      }
      if (context.italicRequested) {
        writer.write('<i>');
      }

      writer.write(this.getEscapedText(middle));

      if (context.italicRequested) {
        writer.write('</i>');
      }
      if (context.boldRequested) {
        writer.write('</b>');
      }
    }

    writer.write(parts[3]); // write trailing whitespace
  }

  protected writeNodes(
    docNodes: ReadonlyArray<DocNode>,
    context: IMarkdownEmitterContext,
  ): void {
    for (const docNode of docNodes) {
      this.writeNode(docNode, context, docNodes.length > 1);
    }
  }
}
