const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TableOfContents
} = require("docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerBg = { fill: "2B579A", type: ShadingType.CLEAR };
const altBg = { fill: "F2F6FA", type: ShadingType.CLEAR };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

const CONTENT_WIDTH = 9360;

// Helper: create a styled paragraph
function p(text, options = {}) {
  return new Paragraph({
    spacing: { after: options.after || 120, before: options.before || 0 },
    alignment: options.align || AlignmentType.LEFT,
    indent: options.indent ? { left: 360 } : undefined,
    children: [new TextRun({ text, size: options.size || 22, bold: options.bold || false, font: "Microsoft YaHei", color: options.color || "333333" })],
  });
}

// Helper: bold label + normal text
function labelValue(label, value, options = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: options.indent ? { left: 360 } : undefined,
    children: [
      new TextRun({ text: label, size: 22, bold: true, font: "Microsoft YaHei", color: "333333" }),
      new TextRun({ text: value, size: 22, font: "Microsoft YaHei", color: "555555" }),
    ],
  });
}

// Helper: heading
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text, size: 36, bold: true, font: "Microsoft YaHei", color: "1A3A6B" })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [new TextRun({ text, size: 28, bold: true, font: "Microsoft YaHei", color: "2B579A" })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 }, children: [new TextRun({ text, size: 24, bold: true, font: "Microsoft YaHei", color: "3B6BC0" })] });
}

// Helper: code block
function codeBlock(code) {
  const lines = code.trim().split("\n");
  return lines.map(line =>
    new Paragraph({
      spacing: { after: 0 },
      indent: { left: 360 },
      shading: { fill: "F4F4F4", type: ShadingType.CLEAR },
      children: [new TextRun({ text: line || " ", font: "Consolas", size: 18 })]
    })
  );
}

// Helper: note box
function noteBox(text) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    indent: { left: 200 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: "2B579A", space: 8 } },
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 20, color: "555555", italics: true })],
  });
}

// Helper: table row from array
function row(cells, isHeader = false, wArray = null) {
  if (!wArray) {
    wArray = cells.map(() => Math.floor(CONTENT_WIDTH / cells.length));
  }
  const bg = isHeader ? headerBg : null;
  return new TableRow({
    children: cells.map((cellText, i) =>
      new TableCell({
        borders,
        width: { size: wArray[i], type: WidthType.DXA },
        shading: bg || undefined,
        margins: cellMargins,
        children: [new Paragraph({
          alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: [new TextRun({ text: cellText, font: "Microsoft YaHei", size: isHeader ? 20 : 18, bold: isHeader, color: isHeader ? "FFFFFF" : "333333" })],
        })],
      })
    ),
  });
}

// Helper: API parameter table
function apiParamTable(params, widths = [1500, 1500, 700, 1000, 1600, 3060]) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      row(["字段名", "变量名", "必填", "类型", "示例值", "描述"], true, widths),
      ...params.map((p, i) =>
        new TableRow({
          children: [
            new TableCell({
              borders, width: { size: widths[0], type: WidthType.DXA }, margins: cellMargins,
              shading: i % 2 === 1 ? altBg : undefined,
              children: [new Paragraph({ children: [new TextRun({ text: p[0], font: "Microsoft YaHei", size: 18, color: "333333" })] })],
            }),
            new TableCell({
              borders, width: { size: widths[1], type: WidthType.DXA }, margins: cellMargins,
              shading: i % 2 === 1 ? altBg : undefined,
              children: [new Paragraph({ children: [new TextRun({ text: p[1], font: "Consolas", size: 18, color: "333333" })] })],
            }),
            new TableCell({
              borders, width: { size: widths[2], type: WidthType.DXA }, margins: cellMargins,
              shading: i % 2 === 1 ? altBg : undefined,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p[2], font: "Microsoft YaHei", size: 18, bold: p[2] === "是", color: p[2] === "是" ? "C0392B" : "7F8C8D" })] })],
            }),
            new TableCell({
              borders, width: { size: widths[3], type: WidthType.DXA }, margins: cellMargins,
              shading: i % 2 === 1 ? altBg : undefined,
              children: [new Paragraph({ children: [new TextRun({ text: p[3], font: "Consolas", size: 18, color: "8E44AD" })] })],
            }),
            new TableCell({
              borders, width: { size: widths[4], type: WidthType.DXA }, margins: cellMargins,
              shading: i % 2 === 1 ? altBg : undefined,
              children: [new Paragraph({ children: [new TextRun({ text: p[4], font: "Consolas", size: 17, color: "555555" })] })],
            }),
            new TableCell({
              borders, width: { size: widths[5], type: WidthType.DXA }, margins: cellMargins,
              shading: i % 2 === 1 ? altBg : undefined,
              children: [new Paragraph({ children: [new TextRun({ text: p[5], font: "Microsoft YaHei", size: 18, color: "555555" })] })],
            }),
          ],
        })
      ),
    ],
  });
}

// ==================== BUILD DOCUMENT ====================

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Microsoft YaHei", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Microsoft YaHei", color: "1A3A6B" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Microsoft YaHei", color: "2B579A" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Microsoft YaHei", color: "3B6BC0" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    // ==================== COVER PAGE ====================
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 3000 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: "OpenHubs PAY", size: 56, bold: true, font: "Microsoft YaHei", color: "1A3A6B" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
          children: [new TextRun({ text: "\u5F00\u7B97\u652F\u4ED8\u7CFB\u7EDF", size: 40, bold: true, font: "Microsoft YaHei", color: "2B579A" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: "\u5168\u65B0 API \u652F\u4ED8\u7CFB\u7EDF\u5BF9\u63A5\u8BF4\u660E\u4E66", size: 32, bold: true, font: "Microsoft YaHei", color: "333333" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200 },
          children: [new TextRun({ text: "Integration Guide", size: 24, font: "Consolas", color: "888888", italics: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 },
          children: [new TextRun({ text: "\u7248\u672C v1.0", size: 22, font: "Microsoft YaHei", color: "888888" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "2026\u5E747\u6708", size: 22, font: "Microsoft YaHei", color: "888888" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
          children: [new TextRun({ text: "\u5F00\u7B97\u667A\u80FD\u79D1\u6280\uFF08\u9752\u5C9B\uFF09\u6709\u9650\u516C\u53F8", size: 22, font: "Microsoft YaHei", color: "888888" })] }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },

    // ==================== TOC & MAIN BODY ====================
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2B579A", space: 4 } },
            children: [new TextRun({ text: "OpenHubs PAY \u5BF9\u63A5\u8BF4\u660E\u4E66 v1.0", font: "Microsoft YaHei", size: 16, color: "999999" })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 4 } },
            children: [
              new TextRun({ text: "\u2014 ", font: "Microsoft YaHei", size: 16, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Consolas", size: 16, color: "999999" }),
              new TextRun({ text: " \u2014", font: "Microsoft YaHei", size: 16, color: "999999" }),
            ],
          })],
        }),
      },
      children: [
        new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ==================== CHAPTER 1: SYSTEM OVERVIEW ====================
        h1("\u7B2C\u4E00\u7AE0 \u7CFB\u7EDF\u6982\u8FF0"),
        h2("1.1 \u7CFB\u7EDF\u7B80\u4ECB"),
        p("\u5F00\u7B97\u652F\u4ED8\u7CFB\u7EDF\uFF08OpenHubs PAY\uFF09\u662F\u4E00\u5957\u5F00\u6E90\u7684\u4F01\u4E1A\u7EA7\u652F\u4ED8\u7CFB\u7EDF\uFF0C\u652F\u6301\u591A\u5546\u6237\u3001\u591A\u5E94\u7528\u3001\u591A\u6E20\u9053\u7684\u652F\u4ED8\u4E1A\u52A1\u5904\u7406\u3002\u7CFB\u7EDF\u63D0\u4F9B\u7EDF\u4E00\u7684 API \u63A5\u53E3\uFF0C\u5546\u6237\u7CFB\u7EDF\u53EF\u4EE5\u901A\u8FC7\u6807\u51C6\u5316\u7684\u534F\u8BAE\u5FEB\u901F\u5BF9\u63A5\u3002"),

        h2("1.2 \u7CFB\u7EDF\u67B6\u6784"),
        p("\u7CFB\u7EDF\u91C7\u7528\u5FAE\u670D\u52A1\u67B6\u6784\uFF0C\u4E3B\u8981\u5305\u542B\u4EE5\u4E0B\u6A21\u5757\uFF1A"),
        ...[
          "\u2022 \u652F\u4ED8\u7F51\u5173\uFF08Payment\uFF09\uFF1A\u6838\u5FC3\u4E1A\u52A1\u6A21\u5757\uFF0C\u5904\u7406\u652F\u4ED8\u3001\u9000\u6B3E\u3001\u8F6C\u8D26\u3001\u5206\u8D26\u7B49\u4E1A\u52A1",
          "\u2022 \u8FD0\u8425\u5E73\u53F0\uFF08Manager\uFF09\uFF1A\u7BA1\u7406\u5546\u6237\u3001\u5E94\u7528\u3001\u6E20\u9053\u914D\u7F6E\u548C\u8BA2\u5355\u67E5\u8BE2",
          "\u2022 \u5546\u6237\u7CFB\u7EDF\uFF08Merchant\uFF09\uFF1A\u5546\u6237\u81EA\u670D\u52A1\u7BA1\u7406\u540E\u53F0\uFF0C\u67E5\u770B\u8BA2\u5355\u3001\u9000\u6B3E\u548C\u62A5\u8868",
          "\u2022 \u5546\u6237\u7CFB\u7EDF\uFF08Merchant\uFF09\uFF1A\u5546\u6237\u81EA\u670D\u52A1\u7BA1\u7406\u540E\u53F0\uFF0C\u67E5\u770B\u8BA2\u5355\u3001\u9000\u6B3E\u548C\u62A5\u8868",
        ].map(item =>
          new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
            children: [new TextRun({ text: item.slice(2), font: "Microsoft YaHei", size: 22, color: "444444" })] })
        ),

        h2("1.3 \u4E24\u79CD\u5BF9\u63A5\u6A21\u5F0F"),
        p("\u672C\u7CFB\u7EDF\u652F\u6301\u4E24\u79CD\u5BF9\u63A5\u65B9\u5F0F\uFF0C\u6839\u636E\u60A8\u7684\u4E1A\u52A1\u573A\u666F\u9009\u62E9\uFF1A"),

        // Mode A
        h3("1.3.1 \u6A21\u5F0F A\uFF1A\u5546\u6237\u5BF9\u63A5\uFF08\u8C03\u7528\u652F\u4ED8 API\uFF09"),
        p("\u60A8\u7684\u4E1A\u52A1\u7CFB\u7EDF\u4F5C\u4E3A\u5546\u6237\uFF0C\u901A\u8FC7 OpenHubs PAY \u63D0\u4F9B\u7684\u7EDF\u4E00 API \u53D1\u8D77\u652F\u4ED8\u3001\u9000\u6B3E\u3001\u67E5\u8BE2\u7B49\u64CD\u4F5C\u3002\u8FD9\u662F\u6700\u5E38\u89C1\u7684\u5BF9\u63A5\u6A21\u5F0F\uFF0C\u9002\u7528\u4E8E\u7F51\u7AD9\u3001APP\u3001\u5C0F\u7A0B\u5E8F\u7B49\u573A\u666F\u3002"),
        p("\u5BF9\u63A5\u6D41\u7A0B\uFF1A\u5546\u6237\u7CFB\u7EDF \u2192 \u7EDF\u4E00\u4E0B\u5355 API \u2192 OpenHubs PAY \u2192 \u4E0A\u6E38\u652F\u4ED8\u6E20\u9053\uFF08\u652F\u4ED8\u5B9D/\u5FAE\u4FE1/\u4E91\u95EA\u4ED8\uFF09"),
        noteBox("\u63D0\u793A\uFF1A\u6B64\u6A21\u5F0F\u9700\u8981\u5148\u5728\u8FD0\u8425\u5E73\u53F0\u6CE8\u518C\u5546\u6237\u3001\u521B\u5EFA\u5E94\u7528\u3001\u914D\u7F6E\u652F\u4ED8\u6E20\u9053\uFF0C\u7136\u540E\u83B7\u53D6\u5546\u6237\u53F7\u3001\u5E94\u7528 ID \u548C API \u79C1\u94A5\u3002"),

        // Mode B
        h3("1.3.2 \u6A21\u5F0F B\uFF1A\u6E20\u9053\u5BF9\u63A5\uFF08\u5C06\u65B0\u652F\u4ED8\u63A5\u53E3\u63A5\u5165\u7CFB\u7EDF\uFF09"),
        p("\u5C06\u7B2C\u4E09\u65B9\u652F\u4ED8\u6E20\u9053\uFF08\u5982 New API \u652F\u4ED8\u7CFB\u7EDF\uFF09\u4F5C\u4E3A\u652F\u4ED8\u6E20\u9053\u63A5\u5165 OpenHubs PAY\u3002\u5F00\u53D1\u4EBA\u5458\u9700\u8981\u7F16\u5199\u6E20\u9053\u9002\u914D\u5668\u4EE3\u7801\u3002"),
        p("\u5BF9\u63A5\u6D41\u7A0B\uFF1A\u5546\u6237\u7CFB\u7EDF \u2192 OpenHubs PAY \u2192 \u60A8\u7684\u65B0\u652F\u4ED8\u6E20\u9053\uFF08New API\uFF09"),
        noteBox("\u63D0\u793A\uFF1A\u6B64\u6A21\u5F0F\u9700\u8981\u4E00\u5B9A\u7684 Java \u5F00\u53D1\u80FD\u529B\uFF0C\u9700\u8981\u5B9E\u73B0\u6307\u5B9A\u63A5\u53E3\u5E76\u7F16\u5199\u6E20\u9053\u9002\u914D\u5668\u3002\u8BE6\u7EC6\u8BF7\u53C2\u89C1\u7B2C\u4E94\u7AE0\u3002"),

        new Paragraph({ children: [new PageBreak()] }),

        // ==================== CHAPTER 2: QUICK START ====================
        h1("\u7B2C\u4E8C\u7AE0 \u5FEB\u901F\u5F00\u59CB"),

        h2("2.1 \u73AF\u5883\u8981\u6C42"),
        ...[
          "\u2022 \u7F51\u7EDC\u73AF\u5883\uFF1A\u5EFA\u8BAE\u4F7F\u7528 HTTPS \u4FDD\u8BC1\u4F20\u8F93\u5B89\u5168",
          "\u2022 \u7F16\u7801\u683C\u5F0F\uFF1AUTF-8",
          "\u2022 \u63D0\u4EA4\u65B9\u5F0F\uFF1APOST \u6216 GET\uFF0C\u652F\u6301 application/json \u548C application/x-www-form-urlencoded",
          "\u2022 \u7B7E\u540D\u7B97\u6CD5\uFF1AMD5\uFF08\u5927\u5199\uFF09",
          "\u2022 \u91D1\u989D\u5355\u4F4D\uFF1A\u5206\uFF08\u6574\u6570\uFF09",
          "\u2022 \u65F6\u95F4\u683C\u5F0F\uFF1A13\u4F4D\u6BEB\u79D2\u65F6\u95F4\u6233",
        ].map(item =>
          new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
            children: [new TextRun({ text: item.slice(2), font: "Microsoft YaHei", size: 22, color: "444444" })] })
        ),

        h2("2.2 \u63A5\u53E3\u57FA\u7840\u5730\u5740"),
        p("\u6240\u6709\u5546\u6237 API \u5747\u901A\u8FC7\u652F\u4ED8\u7F51\u5173\u8C03\u7528\uFF0C\u57FA\u7840\u8DEF\u5F84\u4E3A\uFF1A"),
        codeBlock("https://{your-domain}:9216/api/"),
        p("\u5176\u4E2D {your-domain} \u4E3A\u60A8\u90E8\u7F72\u652F\u4ED8\u7CFB\u7EDF\u7684\u670D\u52A1\u5668\u5730\u5740\u3002\u672C\u5730\u6D4B\u8BD5\u73AF\u5883\u53EF\u4F7F\u7528 http://localhost:9216/api/\u3002"),

        h2("2.3 \u8EAB\u4EFD\u9A8C\u8BC1"),
        p("\u6240\u6709\u63A5\u53E3\u5747\u9700\u8981\u901A\u8FC7\u7B7E\u540D\u8FDB\u884C\u8EAB\u4EFD\u9A8C\u8BC1\u3002\u6BCF\u4E2A\u63A5\u53E3\u8BF7\u6C42\u9700\u8981\u5305\u542B\u4EE5\u4E0B\u516C\u5171\u53C2\u6570\uFF1A"),
        apiParamTable([
          ["\u5546\u6237\u53F7", "mchNo", "\u662F", "String(30)", "M1621873433953", "\u5546\u6237\u53F7\uFF0C\u5728\u8FD0\u8425\u5E73\u53F0\u521B\u5EFA\u5546\u6237\u65F6\u83B7\u5F97"],
          ["\u5E94\u7528 ID", "appId", "\u662F", "String(24)", "60cc09bce4b0f1c0b83761c9", "\u5E94\u7528 ID\uFF0C\u5728\u5546\u6237\u7CFB\u7EDF\u521B\u5EFA\u5E94\u7528\u65F6\u83B7\u5F97"],
          ["\u8BF7\u6C42\u65F6\u95F4", "reqTime", "\u662F", "long", "1622016572190", "13\u4F4D\u6BEB\u79D2\u65F6\u95F4\u6233"],
          ["\u63A5\u53E3\u7248\u672C", "version", "\u662F", "String(3)", "1.0", "\u56FA\u5B9A\u503C\uFF1A1.0"],
          ["\u7B7E\u540D\u7C7B\u578B", "signType", "\u662F", "String(32)", "MD5", "\u56FA\u5B9A\u503C\uFF1AMD5"],
          ["\u7B7E\u540D\u503C", "sign", "\u662F", "String(32)", "C380BEC2...", "\u8BE6\u89C1\u7B2C\u4E09\u7AE0\u7B7E\u540D\u7B97\u6CD5"],
        ]),

        h2("2.4 SDK \u5FEB\u901F\u96C6\u6210"),
        p("\u6211\u4EEC\u63D0\u4F9B\u4E86 Java SDK\uFF0C\u53EF\u4EE5\u6781\u5927\u7B80\u5316\u5BF9\u63A5\u5DE5\u4F5C\u3002\u4EE5\u4E0B\u662F\u4E00\u4E2A\u7B80\u5355\u7684\u7EDF\u4E00\u4E0B\u5355\u793A\u4F8B\uFF1A"),
        codeBlock(`// 1. \u521B\u5EFA\u914D\u7F6E\u5BF9\u8C61
JeepayClient jeepayClient = JeepayClient.getInstance(
    "https://your-domain:9216",  // \u652F\u4ED8\u7F51\u5173\u5730\u5740
    "M1621873433953",            // \u5546\u6237\u53F7
    "EWEFD123RGSRETYDFNGFGFGSHDFGH"  // API \u79C1\u94A5
);

// 2. \u53D1\u8D77\u7EDF\u4E00\u4E0B\u5355
UnifiedOrderRequest request = new UnifiedOrderRequest();
request.setAppId("60cc09bce4b0f1c0b83761c9");
request.setMchOrderNo("ORD" + System.currentTimeMillis());
request.setWayCode("WX_NATIVE");     // \u5FAE\u4FE1\u626B\u7801\u652F\u4ED8
request.setAmount(100L);             // 1\u5143 = 100\u5206
request.setCurrency("cny");
request.setSubject("\u6D4B\u8BD5\u5546\u54C1");
request.setBody("\u5546\u54C1\u63CF\u8FF0");
request.setNotifyUrl("https://your-site.com/notify");
request.setClientIp("127.0.0.1");

UnifiedOrderResponse response = jeepayClient.unifiedOrder(request);
// \u8FD4\u56DE codeUrl \u7528\u4E8E\u751F\u6210\u4E8C\u7EF4\u7801\u6536\u6B3E`),

        new Paragraph({ children: [new PageBreak()] }),

        // ==================== CHAPTER 3: SIGNATURE ====================
        h1("\u7B2C\u4E09\u7AE0 \u7B7E\u540D\u7B97\u6CD5"),

        h2("3.1 \u7B7E\u540D\u751F\u6210\u6B65\u9AA4"),
        p("\u7B7E\u540D\u91C7\u7528 MD5 \u7B97\u6CD5\uFF0C\u5177\u4F53\u6B65\u9AA4\u5982\u4E0B\uFF1A"),
        p("\u7B2C\u4E00\u6B65\uFF1A\u5C06\u6240\u6709\u53C2\u6570\uFF08\u9664 sign \u548C signType\uFF09\u6309\u53C2\u6570\u540D ASCII \u7801\u4ECE\u5C0F\u5230\u5927\u6392\u5E8F\uFF0C\u4F7F\u7528 URL \u952E\u503C\u5BF9\u683C\u5F0F\u62FC\u63A5\u6210\u5B57\u7B26\u4E32 stringA\u3002", { bold: true }),
        p("\u7B2C\u4E8C\u6B65\uFF1A\u5728 stringA \u6700\u540E\u62FC\u63A5 &key=\u4E0E\u5546\u6237\u79C1\u94A5\uFF0C\u5F97\u5230 stringSignTemp\u3002", { bold: true }),
        p("\u7B2C\u4E09\u6B65\uFF1A\u5BF9 stringSignTemp \u8FDB\u884C MD5 \u8FD0\u7B97\uFF0C\u5E76\u5C06\u7ED3\u679C\u8F6C\u6362\u4E3A\u5927\u5199\u3002", { bold: true }),

        h2("3.2 \u7B7E\u540D\u793A\u4F8B"),
        codeBlock(`// \u5F85\u7B7E\u540D\u53C2\u6570
Map<String, Object> params = new HashMap<>();
params.put("platId", "1000");
params.put("mchOrderNo", "P0123456789101");
params.put("amount", 10000);
params.put("clientIp", "192.168.0.111");
params.put("returnUrl", "https://www.example.com");
params.put("notifyUrl", "https://www.example.com");
params.put("reqTime", 1622016572190L);
params.put("version", "1.0");

// \u7B7E\u540D\u8FC7\u7A0B:
// 1. \u6392\u5E8F\u540E\u62FC\u63A5\uFF1Aamount=10000&clientIp=192.168.0.111&mchOrderNo=P0123456789101&...
// 2. \u8FFD\u52A0\u79C1\u94A5\uFF1A...+&key=EWEFD123RGSRETYDFNGFGFGSHDFGH
// 3. MD5\u5E76\u8F6C\u5927\u5199\uFF1A4A5078DABBCE0D9C4E7668DACB96FF7A

// \u6700\u7EC8\u8BF7\u6C42\uFF1A
// amount=10000&clientIp=192.168.0.111&...&version=1.0&signType=MD5&sign=4A5078DABBCE0D9C4E7668DACB96FF7A`),

        h2("3.3 \u6CE8\u610F\u4E8B\u9879"),
        ...[
          "\u2022 \u53C2\u6570\u540D\u533A\u5206\u5927\u5C0F\u5199",
          "\u2022 \u7A7A\u503C\u53C2\u6570\u4E0D\u53C2\u4E0E\u7B7E\u540D",
          "\u2022 sign \u548C signType \u4E0D\u53C2\u4E0E\u7B7E\u540D",
          "\u2022 \u652F\u4ED8\u4E2D\u5FC3\u53EF\u80FD\u589E\u52A0\u6269\u5C55\u5B57\u6BB5\uFF0C\u9A8C\u8BC1\u7B7E\u540D\u65F6\u5FC5\u987B\u652F\u6301",
          "\u2022 API \u79C1\u94A5\u53EF\u5728\u8FD0\u8425\u5E73\u53F0\u4E2D\u7BA1\u7406\u548C\u66F4\u65B0",
        ].map(item =>
          new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
            children: [new TextRun({ text: item.slice(2), font: "Microsoft YaHei", size: 22, color: "444444" })] })
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ==================== CHAPTER 4: MERCHANT API ====================
        h1("\u7B2C\u56DB\u7AE0 \u5546\u6237\u63A5\u5165\u63A5\u53E3\u6587\u6863"),

        // 4.1 Unified Order
        h2("4.1 \u7EDF\u4E00\u4E0B\u5355"),
        p("\u5546\u6237\u4E1A\u52A1\u7CFB\u7EDF\u901A\u8FC7\u7EDF\u4E00\u4E0B\u5355\u63A5\u53E3\u53D1\u8D77\u652F\u4ED8\u6536\u6B3E\u8BA2\u5355\uFF0COpenHubs PAY \u4F1A\u6839\u636E\u5546\u6237\u914D\u7F6E\u7684\u652F\u4ED8\u901A\u9053\u8DEF\u7531\u652F\u4ED8\u6E20\u9053\u5B8C\u6210\u652F\u4ED8\u4E0B\u5355\u3002"),
        p("\u63A5\u53E3\u5730\u5740\uFF1APOST /api/pay/unifiedOrder", { bold: true }),

        h3("\u8BF7\u6C42\u53C2\u6570"),
        apiParamTable([
          ["\u5546\u6237\u53F7", "mchNo", "\u662F", "String(30)", "M1621873433953", "\u5546\u6237\u53F7"],
          ["\u5E94\u7528 ID", "appId", "\u662F", "String(24)", "60cc09bce4b0f1c0b83761c9", "\u5E94\u7528 ID"],
          ["\u5546\u6237\u8BA2\u5355\u53F7", "mchOrderNo", "\u662F", "String(30)", "ORD202106181104", "\u5546\u6237\u751F\u6210\u7684\u8BA2\u5355\u53F7"],
          ["\u652F\u4ED8\u65B9\u5F0F", "wayCode", "\u662F", "String(30)", "WX_NATIVE", "\u652F\u4ED8\u65B9\u5F0F\u4EE3\u7801\uFF0C\u8BE6\u89C1\u652F\u4ED8\u65B9\u5F0F\u8868"],
          ["\u652F\u4ED8\u91D1\u989D", "amount", "\u662F", "int", "100", "\u652F\u4ED8\u91D1\u989D\uFF0C\u5355\u4F4D\uFF1A\u5206"],
          ["\u8D27\u5E01\u4EE3\u7801", "currency", "\u662F", "String(3)", "cny", "\u4E09\u4F4D\u8D27\u5E01\u4EE3\u7801\uFF0C\u4EBA\u6C11\u5E01\uFF1Acny"],
          ["\u5546\u54C1\u6807\u9898", "subject", "\u662F", "String(64)", "\u6D4B\u8BD5\u5546\u54C1", "\u5546\u54C1\u6807\u9898"],
          ["\u5546\u54C1\u63CF\u8FF0", "body", "\u662F", "String(256)", "\u5546\u54C1\u63CF\u8FF0", "\u5546\u54C1\u63CF\u8FF0"],
          ["\u5BA2\u6237\u7AEF IP", "clientIp", "\u5426", "String(32)", "192.168.1.1", "\u5BA2\u6237\u7AEF IPV4 \u5730\u5740"],
          ["\u5F02\u6B65\u901A\u77E5\u5730\u5740", "notifyUrl", "\u5426", "String(128)", "https://.../notify", "\u652F\u4ED8\u7ED3\u679C\u5F02\u6B65\u56DE\u8C03 URL"],
          ["\u540C\u6B65\u8DF3\u8F6C\u5730\u5740", "returnUrl", "\u5426", "String(128)", "https://.../return", "\u652F\u4ED8\u7ED3\u679C\u540C\u6B65\u8DF3\u8F6C URL"],
          ["\u5931\u6548\u65F6\u95F4", "expiredTime", "\u5426", "int", "3600", "\u8BA2\u5355\u5931\u6548\u65F6\u95F4\uFF0C\u5355\u4F4D\u79D2\uFF0C\u9ED8\u8BA42\u5C0F\u65F6"],
          ["\u6E20\u9053\u989D\u5916\u53C2\u6570", "channelExtra", "\u5426", "String(256)", "{\"auth_code\":\"...\"}", "JSON\u683C\u5F0F\uFF0C\u7279\u5B9A\u6E20\u9053\u989D\u5916\u53C2\u6570"],
          ["\u5206\u8D26\u6A21\u5F0F", "divisionMode", "\u5426", "int", "0", "0-\u4E0D\u5141\u8BB81-\u81EA\u52A82-\u624B\u52A8"],
          ["\u6269\u5C55\u53C2\u6570", "extParam", "\u5426", "String(512)", "", "\u5546\u6237\u6269\u5C55\u53C2\u6570\uFF0C\u56DE\u8C03\u65F6\u539F\u6837\u8FD4\u56DE"],
        ]),

        h3("\u8FD4\u56DE\u53C2\u6570\uFF08data\uFF09"),
        apiParamTable([
          ["\u652F\u4ED8\u8BA2\u5355\u53F7", "payOrderId", "\u662F", "String(30)", "P202106181104177050002", "\u652F\u4ED8\u7CFB\u7EDF\u751F\u6210\u7684\u8BA2\u5355\u53F7"],
          ["\u5546\u6237\u8BA2\u5355\u53F7", "mchOrderNo", "\u662F", "String(30)", "ORD202106181104", "\u5546\u6237\u4F20\u5165\u7684\u8BA2\u5355\u53F7"],
          ["\u8BA2\u5355\u72B6\u6001", "orderState", "\u662F", "int", "2", "0-\u751F\u62101-\u652F\u4ED8\u4E2D2-\u6210\u529F3-\u5931\u8D254-\u64A4\u95005-\u9000\u6B3E6-\u5173\u95ED"],
          ["\u652F\u4ED8\u6570\u636E\u7C7B\u578B", "payDataType", "\u662F", "String", "codeUrl", "payUrl/form/codeUrl/codeImgUrl/none"],
          ["\u652F\u4ED8\u6570\u636E", "payData", "\u5426", "String", "weixin://wxpay/...", "\u53D1\u8D77\u652F\u4ED8\u7528\u5230\u7684\u652F\u4ED8\u53C2\u6570"],
        ]),

        h3("\u652F\u4ED8\u65B9\u5F0F\u5BF9\u7167\u8868"),
        apiParamTable([
          ["\u805A\u5408\u626B\u7801", "QR_CASHIER", "", "", "", "\u7528\u6237\u626B\u5546\u5BB6\uFF0C\u652F\u6301\u5FAE\u4FE1/\u652F\u4ED8\u5B9D/\u4E91\u95EA\u4ED8"],
          ["\u805A\u5408\u6761\u7801", "AUTO_BAR", "", "", "", "\u5546\u5BB6\u626B\u7528\u6237\u4ED8\u6B3E\u7801"],
          ["\u5FAE\u4FE1\u5C0F\u7A0B\u5E8F", "WX_LITE", "", "", "", "\u5FAE\u4FE1\u5C0F\u7A0B\u5E8F\u652F\u4ED8"],
          ["\u5FAE\u4FE1\u516C\u4F17\u53F7", "WX_JSAPI", "", "", "", "\u5FAE\u4FE1\u516C\u4F17\u53F7\u652F\u4ED8\uFF0C\u9700 openid"],
          ["\u5FAE\u4FE1\u626B\u7801", "WX_NATIVE", "", "", "", "\u5FAE\u4FE1\u626B\u7801\u652F\u4ED8"],
          ["\u5FAE\u4FE1 H5", "WX_H5", "", "", "", "\u5FAE\u4FE1 H5 \u652F\u4ED8"],
          ["\u5FAE\u4FE1 APP", "WX_APP", "", "", "", "\u5FAE\u4FE1 APP \u652F\u4ED8"],
          ["\u652F\u4ED8\u5B9D\u6761\u7801", "ALI_BAR", "", "", "", "\u652F\u4ED8\u5B9D\u6761\u7801\u652F\u4ED8\uFF0C\u9700 auth_code"],
          ["\u652F\u4ED8\u5B9D\u751F\u6D3B\u53F7", "ALI_JSAPI", "", "", "", "\u652F\u4ED8\u5B9D\u751F\u6D3B\u53F7\u652F\u4ED8"],
          ["\u652F\u4ED8\u5B9D APP", "ALI_APP", "", "", "", "\u652F\u4ED8\u5B9D APP \u652F\u4ED8"],
          ["\u652F\u4ED8\u5B9D WAP", "ALI_WAP", "", "", "", "\u652F\u4ED8\u5B9D\u624B\u673A\u7F51\u7AD9\u652F\u4ED8"],
          ["\u652F\u4ED8\u5B9D PC", "ALI_PC", "", "", "", "\u652F\u4ED8\u5B9D PC \u7F51\u7AD9\u652F\u4ED8"],
          ["\u652F\u4ED8\u5B9D\u626B\u7801", "ALI_QR", "", "", "", "\u652F\u4ED8\u5B9D\u626B\u7801\u652F\u4ED8"],
          ["\u4E91\u95EA\u4ED8\u6761\u7801", "YSF_BAR", "", "", "", "\u4E91\u95EA\u4ED8\u6761\u7801\u652F\u4ED8"],
          ["\u4E91\u95EA\u4ED8 JSAPI", "YSF_JSAPI", "", "", "", "\u4E91\u95EA\u4ED8 JSAPI \u652F\u4ED8"],
        ]),

        h3("channelExtra \u53C2\u6570\u8BF4\u660E"),
        p("\u5F53 wayCode \u4E3A\u4EE5\u4E0B\u503C\u65F6\uFF0C\u9700\u8981\u4F20\u9012 channelExtra \u53C2\u6570\uFF1A"),
        apiParamTable([
          ["\u5FAE\u4FE1\u516C\u4F17\u53F7/\u5C0F\u7A0B\u5E8F", "WX_JSAPI / WX_LITE", "", "", "{\"openid\":\"o6BcIw...\"}", "\u5FAE\u4FE1\u7528\u6237 openid"],
          ["\u805A\u5408\u6761\u7801/\u652F\u4ED8\u5B9D\u6761\u7801", "AUTO_BAR / ALI_BAR", "", "", "{\"auth_code\":\"1392093...\"}", "\u7528\u6237\u4ED8\u6B3E\u7801"],
          ["\u652F\u4ED8\u5B9D\u751F\u6D3B\u53F7", "ALI_JSAPI", "", "", "{\"buyerUserId\":\"2088...\"}", "\u652F\u4ED8\u5B9D\u7528\u6237 ID"],
          ["\u626B\u7801\u7C7B\u652F\u4ED8", "QR_CASHIER/ALI_QR/WX_NATIVE", "", "", "{\"payDataType\":\"codeImgUrl\"}", "\u53EF\u9009\uFF1AcodeUrl/codeImgUrl"],
          ["\u652F\u4ED8\u5B9D WAP", "ALI_WAP", "", "", "{\"payDataType\":\"form\"}", "\u53EF\u9009\uFF1Aform/codeImgUrl/payUrl"],
        ]),

        h3("\u8BF7\u6C42\u793A\u4F8B"),
        codeBlock(`POST /api/pay/unifiedOrder
Content-Type: application/json

{
  "amount": 100,
  "mchOrderNo": "ORD202607221600",
  "subject": "\u5546\u54C1\u6807\u9898",
  "body": "\u5546\u54C1\u63CF\u8FF0",
  "wayCode": "WX_NATIVE",
  "sign": "C380BEC2BFD727A4B6845133519F3AD6",
  "signType": "MD5",
  "reqTime": "1753776000000",
  "version": "1.0",
  "appId": "60cc09bce4b0f1c0b83761c9",
  "clientIp": "192.168.1.1",
  "notifyUrl": "https://your-site.com/pay/notify",
  "currency": "cny",
  "mchNo": "M1621873433953"
}`),

        h3("\u8FD4\u56DE\u793A\u4F8B"),
        codeBlock(`{
  "code": 0,
  "msg": "SUCCESS",
  "sign": "F4DA202C516D1F33A12F1E547C5004FD",
  "data": {
    "payOrderId": "P202607221600001",
    "mchOrderNo": "ORD202607221600",
    "orderState": 1,
    "payDataType": "codeUrl",
    "payData": "weixin://wxpay/bizpayurl?pr=abc123"
  }
}`),

        new Paragraph({ children: [new PageBreak()] }),

        // 4.2 Query Order
        h2("4.2 \u67E5\u8BE2\u8BA2\u5355"),
        p("\u5546\u6237\u901A\u8FC7\u8BE5\u63A5\u53E3\u67E5\u8BE2\u8BA2\u5355\uFF0C\u652F\u4ED8\u7F51\u5173\u4F1A\u8FD4\u56DE\u8BA2\u5355\u6700\u65B0\u7684\u6570\u636E\u3002"),
        p("\u63A5\u53E3\u5730\u5740\uFF1APOST /api/pay/query", { bold: true }),

        h3("\u8BF7\u6C42\u53C2\u6570"),
        apiParamTable([
          ["\u5546\u6237\u53F7", "mchNo", "\u662F", "String(30)", "M1621873433953", ""],
          ["\u5E94\u7528 ID", "appId", "\u662F", "String(24)", "60cc09bce4b0f1c0b83761c9", ""],
          ["\u652F\u4ED8\u8BA2\u5355\u53F7", "payOrderId", "\u662F", "String(30)", "P202106181104", "\u4E0E mchOrderNo \u4E8C\u9009\u4E00"],
          ["\u5546\u6237\u8BA2\u5355\u53F7", "mchOrderNo", "\u662F", "String(30)", "ORD202106181104", "\u4E0E payOrderId \u4E8C\u9009\u4E00"],
        ]),

        h3("\u8FD4\u56DE\u53C2\u6570\uFF08data\uFF09"),
        apiParamTable([
          ["\u652F\u4ED8\u8BA2\u5355\u53F7", "payOrderId", "\u662F", "String(30)", "P202106181104", ""],
          ["\u5546\u6237\u8BA2\u5355\u53F7", "mchOrderNo", "\u662F", "String(30)", "ORD202106181104", ""],
          ["\u652F\u4ED8\u63A5\u53E3", "ifCode", "\u662F", "String(30)", "wxpay", "\u652F\u4ED8\u63A5\u53E3\u7F16\u7801"],
          ["\u652F\u4ED8\u65B9\u5F0F", "wayCode", "\u662F", "String(30)", "WX_NATIVE", "\u652F\u4ED8\u65B9\u5F0F\u4EE3\u7801"],
          ["\u652F\u4ED8\u91D1\u989D", "amount", "\u662F", "int", "100", "\u5355\u4F4D\uFF1A\u5206"],
          ["\u8BA2\u5355\u72B6\u6001", "state", "\u662F", "int", "2", "0-75126"],
          ["\u6E20\u9053\u8BA2\u5355\u53F7", "channelOrderNo", "\u5426", "String", "4200001...", "\u5FAE\u4FE1/\u652F\u4ED8\u5B9D\u7684\u8BA2\u5355\u53F7"],
          ["\u521B\u5EFA\u65F6\u95F4", "createdAt", "\u662F", "long", "1622016572190", "13\u4F4D\u6BEB\u79D2\u65F6\u95F4\u6233"],
          ["\u6210\u529F\u65F6\u95F4", "successTime", "\u5426", "long", "1622016580000", "13\u4F4D\u6BEB\u79D2\u65F6\u95F4\u6233"],
        ]),

        h2("4.3 \u5173\u95ED\u8BA2\u5355"),
        p("\u5546\u6237\u901A\u8FC7\u8BE5\u63A5\u53E3\u5173\u95ED\u8BA2\u5355\uFF0C\u652F\u4ED8\u7F51\u5173\u4F1A\u5BF9\u8BA2\u5355\u5B8C\u6210\u5173\u95ED\u5904\u7406\u3002"),
        p("\u63A5\u53E3\u5730\u5740\uFF1APOST /api/pay/close", { bold: true }),

        new Paragraph({ children: [new PageBreak()] }),

        // 4.4 Payment Notification
        h2("4.4 \u652F\u4ED8\u901A\u77E5"),
        p("\u5F53\u8BA2\u5355\u652F\u4ED8\u6210\u529F\u65F6\uFF0C\u652F\u4ED8\u7F51\u5173\u4F1A\u5411\u5546\u6237\u7CFB\u7EDF\u53D1\u8D77\u56DE\u8C03\u901A\u77E5\u3002"),

        h3("\u901A\u77E5\u53C2\u6570"),
        apiParamTable([
          ["\u652F\u4ED8\u8BA2\u5355\u53F7", "payOrderId", "\u662F", "String(30)", "P202106181104", ""],
          ["\u5546\u6237\u53F7", "mchNo", "\u662F", "String(30)", "M1621873433953", ""],
          ["\u5546\u6237\u8BA2\u5355\u53F7", "mchOrderNo", "\u662F", "String(30)", "ORD202106181104", ""],
          ["\u652F\u4ED8\u63A5\u53E3", "ifCode", "\u662F", "String(30)", "wxpay", ""],
          ["\u652F\u4ED8\u65B9\u5F0F", "wayCode", "\u662F", "String(30)", "WX_NATIVE", ""],
          ["\u652F\u4ED8\u91D1\u989D", "amount", "\u662F", "int", "100", "\u5355\u4F4D\uFF1A\u5206"],
          ["\u8BA2\u5355\u72B6\u6001", "state", "\u662F", "int", "2", "\u652F\u4ED8\u6210\u529F\u65F6\u4E3A2"],
          ["\u6E20\u9053\u8BA2\u5355\u53F7", "channelOrderNo", "\u5426", "String", "4200001...", ""],
          ["\u6269\u5C55\u53C2\u6570", "extParam", "\u5426", "String", "", "\u539F\u6837\u8FD4\u56DE\u5546\u6237\u4F20\u5165\u7684\u503C"],
          ["\u901A\u77E5\u65F6\u95F4", "reqTime", "\u662F", "String(30)", "1622016572190", ""],
          ["\u7B7E\u540D", "sign", "\u662F", "String(32)", "C380BEC2...", "\u5546\u6237\u9700\u9A8C\u7B7E"],
        ]),

        h3("\u5546\u6237\u54CD\u5E94"),
        p("\u5546\u6237\u7CFB\u7EDF\u5904\u7406\u540E\u8FD4\u56DE\u5B57\u7B26\u4E32 success \u8868\u793A\u6210\u529F\u3002\u901A\u77E5\u9891\u7387\u4E3A 0/30/60/90/120/150 \u79D2\u3002", { bold: true }),
        noteBox("\u6CE8\u610F\uFF1A\u8FD4\u56DE\u7684 success \u5FC5\u987B\u662F\u5C0F\u5199\uFF0C\u4E14\u524D\u540E\u4E0D\u80FD\u6709\u7A7A\u683C\u548C\u6362\u884C\u7B26\u3002"),

        h3("\u5546\u6237\u7AEF\u9A8C\u7B7E\u793A\u4F8B"),
        codeBlock(`// \u63A5\u6536\u901A\u77E5\u540E\u9A8C\u8BC1\u7B7E\u540D\uFF08Java\uFF09
public boolean verifyNotifySign(HttpServletRequest request) {
    Map<String, String> params = getAllParams(request);
    String sign = params.remove("sign");  // \u79FB\u9664 sign
    // \u6309 key \u6392\u5E8F\u62FC\u63A5
    String sortedStr = params.entrySet().stream()
        .filter(e -> e.getValue() != null && !e.getValue().isEmpty())
        .sorted(Map.Entry.comparingByKey())
        .map(e -> e.getKey() + "=" + e.getValue())
        .collect(Collectors.joining("&"));
    // \u8FFD\u52A0\u79C1\u94A5\u5E76 MD5
    String calcSign = DigestUtils.md5Hex(sortedStr + "&key=" + API_KEY)
        .toUpperCase();
    return calcSign.equals(sign);
}`),

        new Paragraph({ children: [new PageBreak()] }),

        // 4.5 Refund
        h2("4.5 \u7EDF\u4E00\u9000\u6B3E"),
        p("\u5546\u6237\u4E1A\u52A1\u7CFB\u7EDF\u901A\u8FC7\u7EDF\u4E00\u9000\u6B3E\u63A5\u53E3\u53D1\u8D77\u9000\u6B3E\u8BF7\u6C42\u3002"),
        p("\u63A5\u53E3\u5730\u5740\uFF1APOST /api/refund/refundOrder", { bold: true }),

        apiParamTable([
          ["\u5546\u6237\u53F7", "mchNo", "\u662F", "String(30)", "M1621873433953", ""],
          ["\u5E94\u7528 ID", "appId", "\u662F", "String(24)", "60cc09bce4b0f1c0b83761c9", ""],
          ["\u652F\u4ED8\u8BA2\u5355\u53F7", "payOrderId", "\u662F", "String(30)", "P202106181104", "\u4E0E mchOrderNo \u4E8C\u9009\u4E00"],
          ["\u5546\u6237\u9000\u6B3E\u5355\u53F7", "mchRefundNo", "\u662F", "String(30)", "RF202106181105", "\u5546\u6237\u751F\u6210\u7684\u9000\u6B3E\u5355\u53F7"],
          ["\u9000\u6B3E\u91D1\u989D", "refundAmount", "\u662F", "int", "100", "\u9000\u6B3E\u91D1\u989D\uFF0C\u5355\u4F4D\uFF1A\u5206"],
          ["\u8D27\u5E01\u4EE3\u7801", "currency", "\u662F", "String(3)", "cny", "\u4EBA\u6C11\u5E01\uFF1Acny"],
          ["\u9000\u6B3E\u539F\u56E0", "refundReason", "\u662F", "String(64)", "\u7528\u6237\u9000\u8D27", ""],
          ["\u5F02\u6B65\u901A\u77E5\u5730\u5740", "notifyUrl", "\u5426", "String(128)", "https://.../refund/notify", ""],
        ]),

        h2("4.6 \u67E5\u8BE2\u9000\u6B3E"),
        p("\u63A5\u53E3\u5730\u5740\uFF1APOST /api/refund/query", { bold: true }),
        p("\u53C2\u6570\u4E0E\u67E5\u8BE2\u8BA2\u5355\u7C7B\u4F3C\uFF0C\u4F7F\u7528 refundOrderId \u6216 mchRefundNo\u3002"),

        new Paragraph({ children: [new PageBreak()] }),

        // ==================== CHAPTER 5: CHANNEL INTEGRATION ====================
        h1("\u7B2C\u4E94\u7AE0 \u6E20\u9053\u5BF9\u63A5\uFF08\u63A5\u5165\u65B0\u652F\u4ED8\u63A5\u53E3\uFF09"),

        h2("5.1 \u67B6\u6784\u6982\u8FF0"),
        p("\u5F53\u60A8\u9700\u8981\u5C06\u4E00\u4E2A\u65B0\u7684\u652F\u4ED8\u63A5\u53E3\uFF08\u5982 New API \u652F\u4ED8\u7CFB\u7EDF\uFF09\u4F5C\u4E3A\u652F\u4ED8\u6E20\u9053\u63A5\u5165 OpenHubs PAY\uFF0C\u9700\u8981\u7F16\u5199\u6E20\u9053\u9002\u914D\u5668\u3002\u6BCF\u4E2A\u6E20\u9053\u9700\u8981\u5B9E\u73B0\u4EE5\u4E0B\u63A5\u53E3\uFF1A"),

        apiParamTable([
          ["\u652F\u4ED8\u63A5\u53E3", "IPaymentService", "", "", "", "\u7EDF\u4E00\u4E0B\u5355\uFF0C\u8C03\u8D77\u4E0A\u6E38\u6E20\u9053\u652F\u4ED8"],
          ["\u9000\u6B3E\u63A5\u53E3", "IRefundService", "", "", "", "\u8C03\u8D77\u4E0A\u6E38\u6E20\u9053\u9000\u6B3E"],
          ["\u67E5\u5355\u63A5\u53E3", "IPayOrderQueryService", "", "", "", "\u5411\u4E0A\u6E38\u6E20\u9053\u67E5\u8BE2\u8BA2\u5355\u72B6\u6001"],
          ["\u5173\u5355\u63A5\u53E3", "IPayOrderCloseService", "", "", "", "\u5173\u95ED\u4E0A\u6E38\u6E20\u9053\u8BA2\u5355"],
          ["\u652F\u4ED8\u56DE\u8C03", "IChannelNoticeService", "", "", "", "\u89E3\u6790\u4E0A\u6E38\u6E20\u9053\u7684\u5F02\u6B65\u901A\u77E5"],
          ["\u9000\u6B3E\u56DE\u8C03", "IChannelRefundNoticeService", "", "", "", "\u89E3\u6790\u4E0A\u6E38\u6E20\u9053\u7684\u9000\u6B3E\u901A\u77E5"],
          ["\u6E20\u9053\u7528\u6237", "IChannelUserService", "", "", "", "\u83B7\u53D6 openId/userId \u7B49"],
        ]),

        h2("5.2 \u5F00\u53D1\u6B65\u9AA4"),
        p("\u4EE5\u4E0B\u4EE5 EPay\uFF08\u6613\u652F\u4ED8\uFF09\u6E20\u9053\u4E3A\u53C2\u8003\uFF0C\u8BF4\u660E\u5F00\u53D1\u6B65\u9AA4\u3002\u5B8C\u6574\u7684\u4EE3\u7801\u53EF\u4EE5\u53C2\u8003\uFF1A"),
        p("jeepay-payment/src/main/java/com/jeequan/jeepay/pay/channel/epay/", { bold: true }),

        h3("\u6B65\u9AA4 1\uFF1A\u5B9A\u4E49\u6E20\u9053\u5E38\u91CF"),
        p("\u5728 jeepay-core/.../constants/CS.java \u7684 IF_CODE \u63A5\u53E3\u4E2D\u6DFB\u52A0\u65B0\u7684\u6E20\u9053\u4EE3\u7801\uFF1A"),
        codeBlock(`public interface IF_CODE {
    String ALIPAY = "alipay";
    String WXPAY = "wxpay";
    String EPAY = "epay";
    String NEWAPI = "newapi";  // \u6DFB\u52A0\u65B0\u6E20\u9053\u4EE3\u7801
}`),

        h3("\u6B65\u9AA4 2\uFF1A\u521B\u5EFA\u53C2\u6570\u7C7B"),
        p("\u5728 jeepay-core/.../model/params/ \u4E0B\u521B\u5EFA\u6E20\u9053\u53C2\u6570\u76EE\u5F55\u548C\u7C7B\uFF1A"),
        codeBlock(`// \u6587\u4EF6\uFF1Ajeepay-core/.../model/params/newapi/NewapiNormalMchParams.java
@Data
public class NewapiNormalMchParams extends NormalMchParams {
    private String appId;      // \u65B0\u63A5\u53E3\u7684 App ID
    private String appSecret;  // \u65B0\u63A5\u53E3\u7684\u7B7E\u540D\u5BC6\u94A5
    private String payUrl;     // \u65B0\u63A5\u53E3\u7684\u652F\u4ED8\u7F51\u5173\u5730\u5740
}`),

        h3("\u6B65\u9AA4 3\uFF1A\u521B\u5EFA\u6E20\u9053\u5DE5\u5177\u7C7B"),
        p("\u5B9E\u73B0\u7B7E\u540D\u751F\u6210\u3001\u8BF7\u6C42 URL \u6784\u5EFA\u7B49\u5DE5\u5177\u65B9\u6CD5\uFF1A"),
        codeBlock(`// \u6587\u4EF6\uFF1Apay/channel/newapi/NewapiChannelKit.java
public class NewapiChannelKit {
    public static String getSign(Map<String, String> params, String secret) {
        // 1. \u8FC7\u6EE4\u7A7A\u503C\u548C sign/sign_type
        // 2. \u6309 key \u5B57\u5178\u5E8F\u6392\u5E8F
        // 3. \u62FC\u63A5 k=v&k=v \u683C\u5F0F
        // 4. \u8FFD\u52A0\u5BC6\u94A5\u5E76 MD5
        String signStr = buildSignStr(params) + "&key=" + secret;
        return DigestUtils.md5Hex(signStr).toUpperCase();
    }
}`),

        h3("\u6B65\u9AA4 4\uFF1A\u521B\u5EFA\u652F\u4ED8\u670D\u52A1"),
        p("\u7EE7\u627F AbstractPaymentService\uFF0C\u5B9E\u73B0\u652F\u4ED8\u4E0B\u5355\u903B\u8F91\uFF1A"),
        codeBlock(`// \u6587\u4EF6\uFF1Apay/channel/newapi/NewapiPaymentService.java
@Service
public class NewapiPaymentService extends AbstractPaymentService {

    @Override public String getIfCode() { return "newapi"; }
    @Override public boolean isSupport(String wayCode) { return true; }

    @Override
    public AbstractRS pay(UnifiedOrderRQ rq, PayOrder payOrder,
            MchAppConfigContext ctx) throws Exception {
        // 1. \u83B7\u53D6\u5546\u6237\u914D\u7F6E\u7684\u6E20\u9053\u53C2\u6570
        NewapiNormalMchParams params = (NewapiNormalMchParams)
            ctx.getNormalMchParamsByIfCode("newapi");

        // 2. \u6784\u5EFA\u8BF7\u6C42\u53C2\u6570
        Map<String, String> reqMap = new HashMap<>();
        reqMap.put("appId", params.getAppId());
        reqMap.put("outTradeNo", payOrder.getPayOrderId());
        reqMap.put("totalAmount", payOrder.getAmount().toString());
        reqMap.put("subject", payOrder.getSubject());
        reqMap.put("notifyUrl", getNotifyUrl(payOrder.getPayOrderId()));

        // 3. \u751F\u6210\u7B7E\u540D
        String sign = NewapiChannelKit.getSign(reqMap, params.getAppSecret());
        reqMap.put("sign", sign);

        // 4. HTTP \u8BF7\u6C42\u4E0A\u6E38\u63A5\u53E3
        String resp = HttpUtil.post(params.getPayUrl(), reqMap);
        JSONObject result = JSON.parseObject(resp);

        // 5. \u5904\u7406\u8FD4\u56DE\u7ED3\u679C
        ChannelRetMsg retMsg = new ChannelRetMsg();
        if ("SUCCESS".equals(result.getString("code"))) {
            retMsg.setChannelState(ChannelState.WAITING);
            retMsg.setChannelOrderId(result.getString("transactionId"));
        } else {
            retMsg.setChannelState(ChannelState.CONFIRM_FAIL);
            retMsg.setChannelErrMsg(result.getString("message"));
        }

        // 6. \u6784\u5EFA\u54CD\u5E94
        CommonPayDataRS rs = new CommonPayDataRS();
        rs.setPayDataType(CS.PAY_DATA_TYPE.CODE_URL);
        rs.setPayData(result.getString("qrCode"));
        return rs;
    }
}`),

        h3("\u6B65\u9AA4 5\uFF1A\u521B\u5EFA\u56DE\u8C03\u670D\u52A1"),
        p("\u7EE7\u627F AbstractChannelNoticeService\uFF0C\u5B9E\u73B0\u5F02\u6B65\u901A\u77E5\u89E3\u6790\uFF1A"),
        codeBlock(`// \u6587\u4EF6\uFF1Apay/channel/newapi/NewapiChannelNoticeService.java
@Service
public class NewapiChannelNoticeService extends AbstractChannelNoticeService {

    @Override public String getIfCode() { return "newapi"; }

    @Override
    public MutablePair<String, Object> parseParams(HttpServletRequest request,
            String urlOrderId, NoticeTypeEnum noticeTypeEnum) {
        JSONObject params = getReqParamJSON();
        String payOrderId = params.getString("outTradeNo");
        return MutablePair.of(payOrderId, params);
    }

    @Override
    public ChannelRetMsg doNotice(HttpServletRequest request, Object params,
            PayOrder payOrder, MchAppConfigContext ctx,
            NoticeTypeEnum noticeTypeEnum) {
        JSONObject noticeParams = (JSONObject) params;
        NewapiNormalMchParams mchParams = (NewapiNormalMchParams)
            ctx.getNormalMchParamsByIfCode("newapi");

        // \u9A8C\u7B7E
        Map<String, String> signMap = noticeParams.toJavaObject(
            new TypeReference<Map<String, String>>() {});
        String calcSign = NewapiChannelKit.getSign(signMap, mchParams.getAppSecret());
        if (!calcSign.equals(noticeParams.getString("sign"))) {
            return ChannelRetMsg.sysError("\u7B7E\u540D\u9A8C\u8BC1\u5931\u8D25");
        }

        // \u5224\u65AD\u652F\u4ED8\u72B6\u6001
        String status = noticeParams.getString("tradeStatus");
        if ("SUCCESS".equals(status)) {
            ChannelRetMsg msg = ChannelRetMsg.confirmSuccess(
                noticeParams.getString("transactionId"));
            msg.setResponseEntity(textResp("SUCCESS"));
            return msg;
        }
        return ChannelRetMsg.waiting();
    }
}`),

        h3("\u6B65\u9AA4 6\uFF1A\u6570\u636E\u5E93\u914D\u7F6E"),
        p("\u5728 init.sql \u4E2D\u6DFB\u52A0\u652F\u4ED8\u63A5\u53E3\u5B9A\u4E49\uFF1A"),
        codeBlock(`INSERT INTO t_pay_interface_define
(if_code, if_name, is_mch_mode, is_isv_mode, config_page_type,
 normal_mch_params, way_codes, icon, bg_color, state)
VALUES ('newapi', 'New API\u652F\u4ED8', 1, 0, 1,
    '[{"name":"appId","desc":"App ID","type":"text","verify":"required"},
      {"name":"appSecret","desc":"\u7B7E\u540D\u5BC6\u94A5","type":"textarea","verify":"required"},
      {"name":"payUrl","desc":"\u652F\u4ED8\u7F51\u5173\u5730\u5740","type":"text","verify":"required"}]',
    '[{"wayCode": "NEWAPI_QR"}, {"wayCode": "NEWAPI_H5"}]',
    '', '#2E86C1', 1);`),

        noteBox("\u70ED\u63D2\u5F0F\u8BBE\u8BA1\uFF1A\u65B0\u6E20\u9053\u4EE3\u7801\u53EF\u4EE5\u5355\u72EC\u6253\u5305\u4E3A JAR\uFF0C\u653E\u5165 libs \u76EE\u5F55\u540E\u4F1A\u81EA\u52A8\u52A0\u8F7D\uFF0C\u65E0\u9700\u4FEE\u6539\u4E3B\u7A0B\u5E8F\u4EE3\u7801\u3002"),

        new Paragraph({ children: [new PageBreak()] }),

        // ==================== CHAPTER 6: APPENDIX ====================
        h1("\u7B2C\u516D\u7AE0 \u9644\u5F55"),

        h2("6.1 \u8BA2\u5355\u72B6\u6001\u7801"),
        apiParamTable([
          ["0", "\u8BA2\u5355\u751F\u6210", "", "", "\u8BA2\u5355\u5DF2\u521B\u5EFA\u4F46\u672A\u53D1\u8D77\u652F\u4ED8"],
          ["1", "\u652F\u4ED8\u4E2D", "", "", "\u5DF2\u53D1\u8D77\u652F\u4ED8\uFF0C\u7B49\u5F85\u652F\u4ED8\u7ED3\u679C"],
          ["2", "\u652F\u4ED8\u6210\u529F", "", "", "\u652F\u4ED8\u5DF2\u5B8C\u6210"],
          ["3", "\u652F\u4ED8\u5931\u8D25", "", "", "\u652F\u4ED8\u5931\u8D25"],
          ["4", "\u5DF2\u64A4\u9500", "", "", "\u8BA2\u5355\u5DF2\u64A4\u9500"],
          ["5", "\u5DF2\u9000\u6B3E", "", "", "\u8BA2\u5355\u5DF2\u9000\u6B3E"],
          ["6", "\u8BA2\u5355\u5173\u95ED", "", "", "\u8BA2\u5355\u5DF2\u5173\u95ED"],
        ]),

        h2("6.2 \u652F\u4ED8\u6570\u636E\u7C7B\u578B\u8BF4\u660E"),
        apiParamTable([
          ["payUrl", "\u8DF3\u8F6C\u94FE\u63A5", "", "", "\u7528\u6237\u8DF3\u8F6C\u5230\u8BE5 URL \u8FDB\u884C\u652F\u4ED8"],
          ["form", "\u8868\u5355\u63D0\u4EA4", "", "", "\u81EA\u52A8\u63D0\u4EA4 HTML \u8868\u5355"],
          ["codeUrl", "\u4E8C\u7EF4\u7801 URL", "", "", "\u4E8C\u7EF4\u7801\u94FE\u63A5\uFF0C\u53EF\u7528 QR \u5E93\u751F\u6210\u56FE\u7247"],
          ["codeImgUrl", "\u4E8C\u7EF4\u7801\u56FE\u7247", "", "", "\u76F4\u63A5\u8FD4\u56DE\u4E8C\u7EF4\u7801\u56FE\u7247 URL"],
          ["none", "\u65E0\u652F\u4ED8\u53C2\u6570", "", "", "\u4E0D\u9700\u8981\u53D1\u8D77\u652F\u4ED8\u64CD\u4F5C\uFF08\u5982\u6761\u7801\u652F\u4ED8\u5DF2\u5B8C\u6210\uFF09"],
        ]),

        h2("6.3 \u8FD4\u56DE\u7801\u8BF4\u660E"),
        apiParamTable([
          ["0", "\u6210\u529F", "", "", "\u5904\u7406\u6210\u529F"],
          ["9999", "\u5F02\u5E38", "", "", "\u5177\u4F53\u9519\u8BEF\u8BE6\u89C1 msg \u5B57\u6BB5"],
        ]),

        h2("6.4 \u5E38\u89C1\u95EE\u9898"),
        h3("Q: \u7B7E\u540D\u9A8C\u8BC1\u5931\u8D25\u600E\u4E48\u6392\u67E5\uFF1F"),
        ...[
          "\u2022 \u786E\u8BA4\u53C2\u6570\u540D\u662F\u5426\u4E0E\u6587\u6863\u4E00\u81F4\uFF08\u533A\u5206\u5927\u5C0F\u5199\uFF09",
          "\u2022 \u786E\u8BA4\u7A7A\u503C\u53C2\u6570\u662F\u5426\u5DF2\u8FC7\u6EE4",
          "\u2022 \u786E\u8BA4\u5BC6\u94A5\u662F\u5426\u6B63\u786E\uFF08\u5728\u8FD0\u8425\u5E73\u53F0\u4E2D\u67E5\u770B\uFF09",
          "\u2022 \u786E\u8BA4\u5B57\u7B26\u7F16\u7801\u4E3A UTF-8",
          "\u2022 \u5EFA\u8BAE\u4F7F\u7528\u63D0\u4F9B\u7684 SDK \u8FDB\u884C\u5BF9\u63A5",
        ].map(item =>
          new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
            children: [new TextRun({ text: item.slice(2), font: "Microsoft YaHei", size: 22, color: "444444" })] })
        ),

        h3("Q: \u652F\u4ED8\u901A\u77E5\u6CA1\u6709\u6536\u5230\u600E\u4E48\u529E\uFF1F"),
        ...[
          "\u2022 \u786E\u8BA4 notifyUrl \u662F\u5426\u53EF\u4ECE\u516C\u7F51\u8BBF\u95EE",
          "\u2022 \u786E\u8BA4\u5546\u6237\u670D\u52A1\u5668\u8FD4\u56DE\u7684\u662F\u5C0F\u5199\u5B57\u7B26\u4E32 success\uFF08\u6CA1\u6709\u6362\u884C\u7B26\u548C\u7A7A\u683C\uFF09",
          "\u2022 \u67E5\u770B\u5546\u6237\u670D\u52A1\u5668\u65E5\u5FD7\u786E\u8BA4\u662F\u5426\u6536\u5230\u8BF7\u6C42",
          "\u2022 \u7CFB\u7EDF\u4F1A\u91CD\u8BD5\u901A\u77E5\uFF0830\u79D2\u300160\u79D2\u300190\u79D2\u3001120\u79D2\u3001150\u79D2\u95F4\u9694\uFF09",
        ].map(item =>
          new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
            children: [new TextRun({ text: item.slice(2), font: "Microsoft YaHei", size: 22, color: "444444" })] })
        ),

        h3("Q: \u5982\u4F55\u5728\u8FD0\u8425\u5E73\u53F0\u914D\u7F6E\u65B0\u6E20\u9053\uFF1F"),
        p("\u767B\u5F55\u8FD0\u8425\u5E73\u53F0 \u2192 \u7CFB\u7EDF\u7BA1\u7406 \u2192 \u652F\u4ED8\u63A5\u53E3\u914D\u7F6E \u2192 \u6DFB\u52A0\u914D\u7F6E \u2192 \u9009\u62E9\u65B0\u6E20\u9053\u7684\u63A5\u53E3\u4EE3\u7801 \u2192 \u586B\u5199 App ID\u3001\u5BC6\u94A5\u3001\u7F51\u5173\u5730\u5740 \u2192 \u4FDD\u5B58\u3002"),

        new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "\u2014 \u6587\u6863\u7ED3\u675F \u2014", font: "Microsoft YaHei", size: 22, color: "999999" })] }),
      ],
    },
  ],
});

// ==================== WRITE FILE ====================
const outputPath = "C:/Users/Administrator/Documents/WorkBuddy/Github/jeepay-plus/docs/OpenHubs_PAY_NewAPI_Integration_Guide.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Document created: " + outputPath);
  console.log("Size: " + (buffer.length / 1024).toFixed(1) + " KB");
}).catch(err => {
  console.error("Error: " + err.message);
  process.exit(1);
});
