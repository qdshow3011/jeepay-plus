const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageBreak, PageNumber, LevelFormat,
  TableOfContents
} = require("docx");

const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;
const MARGIN = 1440;
const CONTENT_WIDTH = A4_WIDTH - 2 * MARGIN; // 9026

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: "2E75B6" };
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

const font = "Microsoft YaHei";
const fontSize = 22; // 11pt

// Helper: styled heading
function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font, bold: true, size: 36, color: "1F4E79" })] }); }
function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font, bold: true, size: 30, color: "2E75B6" })] }); }
function h3(text) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, font, bold: true, size: 26, color: "404040" })] }); }

// Helper: normal paragraph
function p(text) {
  return new Paragraph({
    spacing: { line: 360, after: 120 },
    children: [new TextRun({ text, font, size: fontSize })]
  });
}

// Helper: bold inline
function b(text) { return new TextRun({ text, font, bold: true, size: fontSize }); }
function n(text) { return new TextRun({ text, font, size: fontSize }); }
function code(text) { return new TextRun({ text, font: "Consolas", size: 20, color: "C7254E" }); }

// Helper: rich paragraph with mixed formatting
function rich(runs) {
  return new Paragraph({ spacing: { line: 360, after: 120 }, children: runs });
}

// Helper: code block
function codeBlock(text) {
  return new Paragraph({
    spacing: { line: 300, after: 80 },
    indent: { left: 360 },
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
    children: [new TextRun({ text, font: "Consolas", size: 20 })]
  });
}

// Helper: table
function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders: headerBorders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: "2E75B6", type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: h, font, bold: true, size: 20, color: "FFFFFF" })] })]
    }))
  });
  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: cell, font, size: 20 })] })]
    }))
  }));
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  });
}

// Helper: bullet item
function bullet(text, ref, level) {
  return new Paragraph({
    numbering: { reference: ref || "bullets", level: level || 0 },
    spacing: { line: 340, after: 60 },
    children: [new TextRun({ text, font, size: fontSize })]
  });
}

function numberedItem(text, ref, level) {
  return new Paragraph({
    numbering: { reference: ref || "numbers", level: level || 0 },
    spacing: { line: 340, after: 60 },
    children: [new TextRun({ text, font, size: fontSize })]
  });
}

// ========================================
// Build document
// ========================================

// Cover page
const coverPage = [
  new Paragraph({ spacing: { before: 3600 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: "OpenHubs PAY", font, bold: true, size: 64, color: "1F4E79" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: "\u5F00\u7B97\u652F\u4ED8\u7CFB\u7EDF", font, bold: true, size: 56, color: "2E75B6" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "\u8F6F\u4EF6\u4F7F\u7528\u8BF4\u660E\u4E66", font, size: 40, color: "666666" })]
  }),
  new Paragraph({ spacing: { before: 1200 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "\u7248\u672C\u53F7\uFF1Av2.4.0", font, size: 24, color: "999999" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "\u6587\u6863\u7248\u672C\uFF1AV1.0", font, size: 24, color: "999999" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "\u65E5\u671F\uFF1A2026\u5E747\u6708", font, size: 24, color: "999999" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 600 },
    children: [new TextRun({ text: "\u5F00\u7B97\u667A\u80FD\u79D1\u6280\uFF08\u9752\u5C9B\uFF09\u6709\u9650\u516C\u53F8", font, size: 24, color: "999999" })]
  }),
];

// TOC
const tocPage = [
  h1("\u76EE\u5F55"),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
];

// Chapter 1
const ch1 = [
  new Paragraph({ children: [new PageBreak()] }),
  h1("\u7B2C\u4E00\u7AE0  \u9879\u76EE\u6982\u8FF0"),
  h2("1.1 \u7CFB\u7EDF\u7B80\u4ECB"),
  p("OpenHubs PAY\uFF08\u5F00\u7B97\u652F\u4ED8\uFF09\u662F\u4E00\u5957\u57FA\u4E8EJava 17\u5F00\u53D1\u7684\u4F01\u4E1A\u7EA7\u805A\u5408\u652F\u4ED8\u7CFB\u7EDF\uFF0C\u7531\u5F00\u7B97\u667A\u80FD\u79D1\u6280\uFF08\u9752\u5C9B\uFF09\u6709\u9650\u516C\u53F8\u7814\u53D1\u3002\u8BE5\u7CFB\u7EDF\u63D0\u4F9B\u5B8C\u6574\u7684\u652F\u4ED8\u89E3\u51B3\u65B9\u6848\uFF0C\u5305\u62EC\u652F\u4ED8\u7F51\u5173\u3001\u8FD0\u8425\u5E73\u53F0\u7BA1\u7406\u7AEF\u3001\u5546\u6237\u5E73\u53F0\u7BA1\u7406\u7AEF\u548C\u6536\u94F6\u53F0\u524D\u7AEF\u3002"),
  p("\u7CFB\u7EDF\u652F\u6301\u591A\u79CD\u652F\u4ED8\u6E20\u9053\uFF0C\u5305\u62EC\u652F\u4ED8\u5B9D\u3001\u5FAE\u4FE1\u652F\u4ED8\u3001\u4E91\u95EA\u4ED8\u3001PayPal\u3001\u5F00\u7B97\u4ED8\u3001\u5C0F\u65B0\u652F\u4ED8\u7B49\uFF0C\u63D0\u4F9B\u7EDF\u4E00\u7684\u652F\u4ED8\u63A5\u53E3\u548C\u5546\u6237\u7BA1\u7406\u529F\u80FD\u3002"),
  h2("1.2 \u6280\u672F\u6808"),
  makeTable(
    ["\u5C42\u9762", "\u6280\u672F"],
    [
      ["\u540E\u7AEF\u6846\u67B6", "Spring Boot 3.5.11 + Java 17"],
      ["ORM\u6846\u67B6", "MyBatis-Plus 3.5.16"],
      ["\u5B89\u5168\u8BA4\u8BC1", "Spring Security + JWT (jjwt 0.13.0)"],
      ["\u6570\u636E\u5E93", "MySQL 8.0"],
      ["\u7F13\u5B58", "Redis 7.4"],
      ["\u6D88\u606F\u961F\u5217", "ActiveMQ"],
      ["\u524D\u7AEF\u6846\u67B6", "Vue 3 + Ant Design Vue 4.x + Vite 5 + TypeScript"],
      ["API\u6587\u6863", "Knife4j (OpenAPI 3)"],
      ["\u90E8\u7F72", "Docker Compose (8\u4E2A\u670D\u52A1\u7F16\u6392)"],
    ],
    [2800, 6226]
  ),
  h2("1.3 \u4E3B\u8981\u7279\u6027"),
  bullet("\u652F\u6301\u652F\u4ED8\u5B9D\u3001\u5FAE\u4FE1\u652F\u4ED8\u3001\u4E91\u95EA\u4ED8\u3001PayPal\u7B496\u79CD\u652F\u4ED8\u6E20\u9053"),
  bullet("\u63D0\u4F9B\u7EDF\u4E00\u652F\u4ED8\u3001\u9000\u6B3E\u3001\u8F6C\u8D26\u3001\u5206\u8D26API\u63A5\u53E3"),
  bullet("\u8FD0\u8425\u5E73\u53F0\u652F\u6301\u591A\u5546\u6237\u3001\u591A\u670D\u52A1\u5546\u7BA1\u7406"),
  bullet("\u5546\u6237\u5E73\u53F0\u63D0\u4F9B\u81EA\u52A9\u914D\u7F6E\u3001\u8BA2\u5355\u67E5\u8BE2\u3001\u62A5\u8868\u7EDF\u8BA1"),
  bullet("\u652F\u6301\u805A\u5408\u7801\u6536\u94F6\u53F0\uFF0C\u5FAE\u4FE1\u652F\u4ED8\u5B9D\u4E00\u7801\u6258\u591A\u65B9"),
  bullet("Docker Compose\u4E00\u952E\u90E8\u7F72\uFF0C\u5168\u670D\u52A1\u5065\u5EB7\u68C0\u67E5"),
  bullet("RBAC\u6743\u9650\u6A21\u578B\uFF0C\u652F\u6301\u591A\u89D2\u8272\u3001\u591A\u7528\u6237\u7BA1\u7406"),
  bullet("\u6D88\u606F\u961F\u5217\u5F02\u6B65\u901A\u77E5\uFF0C\u4FDD\u8BC1\u9AD8\u53EF\u7528"),
];

// Chapter 2
const ch2 = [
  new Paragraph({ children: [new PageBreak()] }),
  h1("\u7B2C\u4E8C\u7AE0  \u7CFB\u7EDF\u67B6\u6784"),
  h2("2.1 \u6574\u4F53\u67B6\u6784"),
  p("OpenHubs PAY\u91C7\u7528\u524D\u540E\u7AEF\u5206\u79BB\u67B6\u6784\uFF0C\u540E\u7AEF\u5206\u4E3A\u591A\u4E2A\u5FAE\u670D\u52A1\u6A21\u5757\uFF0C\u901A\u8FC7Docker Compose\u7EDF\u4E00\u7F16\u6392\u90E8\u7F72\u3002\u4E3B\u8981\u5305\u542B\u4EE5\u4E0B\u7EC4\u4EF6\uFF1A"),
  makeTable(
    ["\u7EC4\u4EF6", "\u7AEF\u53E3", "\u8BF4\u660E"],
    [
      ["payment", "9216", "\u652F\u4ED8\u7EDF\u4E00\u7F51\u5173\uFF0C\u5904\u7406\u6240\u6709\u652F\u4ED8\u4EA4\u6613"],
      ["manager", "9217", "\u8FD0\u8425\u5E73\u53F0\u540E\u7AEF\uFF0C\u63D0\u4F9B\u7BA1\u7406\u5458\u529F\u80FD"],
      ["merchant", "9218", "\u5546\u6237\u5E73\u53F0\u540E\u7AEF\uFF0C\u63D0\u4F9B\u5546\u6237\u81EA\u52A9\u529F\u80FD"],
      ["ui-manager", "9227", "\u8FD0\u8425\u5E73\u53F0\u524D\u7AEF (Vue 3)"],
      ["ui-merchant", "9228", "\u5546\u6237\u5E73\u53F0\u524D\u7AEF (Vue 3)"],
      ["ui-cashier", "9226", "\u805A\u5408\u7801\u6536\u94F6\u53F0\u524D\u7AEF"],
      ["MySQL", "3306", "\u6570\u636E\u5E93\u670D\u52A1 (16\u5F20\u8868)"],
      ["Redis", "6379", "\u7F13\u5B58\u670D\u52A1 (Token\u3001\u914D\u7F6E\u7F13\u5B58)"],
      ["ActiveMQ", "61616", "\u6D88\u606F\u961F\u5217 (6\u79CD\u4E1A\u52A1\u6D88\u606F)"],
    ],
    [2200, 1200, 5626]
  ),
  h2("2.2 \u6A21\u5757\u8BF4\u660E"),
  makeTable(
    ["\u6A21\u5757", "\u8BF4\u660E"],
    [
      ["jeepay-core", "\u57FA\u7840\u6838\u5FC3\u5305\uFF1A\u5B9E\u4F53\u7C7B\u3001JWT\u5DE5\u5177\u3001\u5E38\u91CF\u3001\u7F13\u5B58\u3001\u5F02\u5E38\u5904\u7406\u3001\u62BD\u8C61\u63A7\u5236\u5668"],
      ["jeepay-service", "\u6570\u636E\u8BBF\u95EE\u5C42\uFF1A22\u4E2AService\u5B9E\u73B0\u7C7B\u300121\u4E2AMyBatis Mapper\u63A5\u53E3"],
      ["jeepay-manager", "\u8FD0\u8425\u5E73\u53F0\u540E\u7AEF\uFF1A\u5546\u6237\u7BA1\u7406\u3001\u670D\u52A1\u5546\u7BA1\u7406\u3001\u8BA2\u5355\u67E5\u770B\u3001\u7CFB\u7EDF\u914D\u7F6E"],
      ["jeepay-merchant", "\u5546\u6237\u5E73\u53F0\u540E\u7AEF\uFF1A\u5E94\u7528\u914D\u7F6E\u3001\u8BA2\u5355\u7BA1\u7406\u3001\u5206\u8D26\u7BA1\u7406\u3001\u8F6C\u8D26"],
      ["jeepay-payment", "\u652F\u4ED8\u7F51\u5173\uFF1A\u7EDF\u4E00\u4E0B\u5355\u3001\u56DE\u8C03\u5904\u7406\u3001\u6E20\u9053\u8DEF\u7531"],
      ["jeepay-components-mq", "\u6D88\u606F\u961F\u5217\u7EC4\u4EF6\uFF1AActiveMQ\u5C01\u88C5\uFF0C6\u79CD\u4E1A\u52A1\u6D88\u606F"],
      ["jeepay-components-oss", "\u5BF9\u8C61\u5B58\u50A8\u7EC4\u4EF6\uFF1A\u652F\u6301\u672C\u5730\u5B58\u50A8\u548C\u963F\u91CC\u4E91OSS"],
      ["jeepay-ui", "\u524D\u7AEF\u9879\u76EE\uFF1A3\u4E2A\u5B50\u5E94\u7528 (manager/merchant/cashier)"],
      ["jeepay-z-codegen", "\u4EE3\u7801\u751F\u6210\u5668\uFF1AMyBatis-Plus\u4EE3\u7801\u81EA\u52A8\u751F\u6210"],
    ],
    [2600, 6426]
  ),
  h2("2.3 \u6838\u5FC3\u4E1A\u52A1\u6D41\u7A0B"),
  h3("2.3.1 \u7EDF\u4E00\u4E0B\u5355\u6D41\u7A0B"),
  numberedItem("\u5546\u6237\u5E94\u7528\u4F7F\u7528appSecret\u5BF9\u8BF7\u6C42\u53C2\u6570\u8FDB\u884CMD5\u7B7E\u540D"),
  numberedItem("\u652F\u4ED8\u7F51\u5173\u9A8C\u7B7E\u540E\uFF0C\u67E5\u8BE2\u5546\u6237\u652F\u4ED8\u901A\u9053\u914D\u7F6E"),
  numberedItem("\u6839\u636E\u652F\u4ED8\u65B9\u5F0F\uFF0C\u52A8\u6001\u83B7\u53D6\u5BF9\u5E94\u6E20\u9053\u652F\u4ED8\u670D\u52A1"),
  numberedItem("\u751F\u6210\u652F\u4ED8\u8BA2\u5355\u5E76\u5165\u5E93\uFF0C\u72B6\u6001\u4E3A\u201C\u652F\u4ED8\u4E2D\u201D"),
  numberedItem("\u8C03\u7528\u4E0A\u6E38\u652F\u4ED8\u6E20\u9053\u63A5\u53E3\u53D1\u8D77\u652F\u4ED8"),
  numberedItem("\u6E20\u9053\u5F02\u6B65\u901A\u77E5\u5230\u8FBE\u540E\uFF0C\u66F4\u65B0\u8BA2\u5355\u72B6\u6001"),
  numberedItem("\u901A\u8FC7MQ\u53D1\u9001\u5546\u6237\u901A\u77E5\uFF0C\u5E76\u89E6\u53D1\u540E\u7EED\u5206\u8D26\u7B49\u64CD\u4F5C"),
  h3("2.3.2 \u8BA4\u8BC1\u6D41\u7A0B"),
  p("\u8FD0\u8425\u5E73\u53F0\u548C\u5546\u6237\u5E73\u53F0\u91C7\u7528JWT + Redis\u7684\u65E0\u72B6\u6001\u8BA4\u8BC1\u65B9\u6848\uFF1A"),
  bullet("\u7528\u6237\u767B\u5F55\u540E\uFF0C\u670D\u52A1\u7AEF\u751F\u6210JWT Token\u8FD4\u56DE\u524D\u7AEF"),
  bullet("\u4F1A\u8BDD\u4FE1\u606F\u5B58\u50A8\u5728Redis\u4E2D\uFF0CTTL\u4E3A2\u5C0F\u65F6"),
  bullet("\u6BCF\u6B21\u8BF7\u6C42\u901A\u8FC7Filter\u89E3\u6790Token\u5E76\u4ECERedis\u83B7\u53D6\u7528\u6237\u4FE1\u606F"),
  bullet("\u652F\u4ED8\u7F51\u5173\u4F7F\u7528\u5546\u6237\u5E94\u7528\u5BC6\u94A5\u8FDB\u884CMD5\u7B7E\u540D\u9A8C\u8BC1\uFF0C\u4E0D\u4F7F\u7528JWT"),
];

// Chapter 3
const ch3 = [
  new Paragraph({ children: [new PageBreak()] }),
  h1("\u7B2C\u4E09\u7AE0  \u73AF\u5883\u8981\u6C42"),
  h2("3.1 \u786C\u4EF6\u8981\u6C42"),
  makeTable(
    ["\u8D44\u6E90", "\u6700\u4F4E\u914D\u7F6E", "\u63A8\u8350\u914D\u7F6E"],
    [
      ["CPU", "2\u6838", "4\u6838\u4EE5\u4E0A"],
      ["\u5185\u5B58", "4GB", "8GB\u4EE5\u4E0A"],
      ["\u78C1\u76D8", "20GB\u53EF\u7528", "50GB SSD"],
    ],
    [1800, 3000, 4226]
  ),
  h2("3.2 \u8F6F\u4EF6\u8981\u6C42"),
  makeTable(
    ["\u8F6F\u4EF6", "\u7248\u672C\u8981\u6C42", "\u5907\u6CE8"],
    [
      ["JDK", "17\u4EE5\u4E0A", "\u5FC5\u9700"],
      ["Maven", "3.6+", "\u9879\u76EE\u5DF2\u542Bmvnw wrapper"],
      ["Node.js", "20.x", "\u524D\u7AEF\u6784\u5EFA"],
      ["Docker", "20.10+", "\u5BB9\u5668\u5316\u90E8\u7F72"],
      ["Docker Compose", "v2+", "\u670D\u52A1\u7F16\u6392"],
      ["PowerShell", "7+", "\u53EF\u9009\uFF0C\u914D\u7F6E\u68C0\u67E5\u811A\u672C"],
    ],
    [2000, 2400, 4626]
  ),
  h2("3.3 \u7F51\u7EDC\u7AEF\u53E3"),
  makeTable(
    ["\u670D\u52A1", "\u7AEF\u53E3", "\u7528\u9014"],
    [
      ["payment", "9216", "\u652F\u4ED8\u7F51\u5173 (\u5FC5\u987B\u5BF9\u5916\u66B4\u9732)"],
      ["manager", "9217", "\u8FD0\u8425\u5E73\u53F0\u540E\u7AEF"],
      ["merchant", "9218", "\u5546\u6237\u5E73\u53F0\u540E\u7AEF"],
      ["MySQL", "3306", "\u6570\u636E\u5E93"],
      ["Redis", "6379", "\u7F13\u5B58"],
      ["ActiveMQ", "61616", "\u6D88\u606F\u961F\u5217 (JMS)"],
      ["ActiveMQ Web", "8161", "\u6D88\u606F\u961F\u5217\u7BA1\u7406\u63A7\u5236\u53F0"],
    ],
    [2400, 1600, 5026]
  ),
];

// Chapter 4
const ch4 = [
  new Paragraph({ children: [new PageBreak()] }),
  h1("\u7B2C\u56DB\u7AE0  \u5B89\u88C5\u90E8\u7F72"),
  h2("4.1 \u83B7\u53D6\u6E90\u7801"),
  codeBlock("git clone https://github.com/qdshow3011/jeepay-plus.git"),
  codeBlock("cd jeepay-plus"),
  h2("4.2 \u914D\u7F6E\u73AF\u5883\u53D8\u91CF"),
  p("\u590D\u5236\u73AF\u5883\u53D8\u91CF\u6A21\u677F\u6587\u4EF6\uFF0C\u5E76\u4FEE\u6539\u5176\u4E2D\u7684\u914D\u7F6E\u503C\uFF1A"),
  codeBlock("cp .env.example .env"),
  p("\u7F16\u8F91 .env \u6587\u4EF6\uFF0C\u4FEE\u6539\u4EE5\u4E0B\u5FC5\u586B\u9879\uFF1A"),
  bullet("MYSQL_ROOT_PASSWORD: MySQL root\u5BC6\u7801"),
  bullet("MYSQL_PASSWORD: \u5E94\u7528\u6570\u636E\u5E93\u5BC6\u7801"),
  bullet("MANAGER_JWT_SECRET: \u8FD0\u8425\u5E73\u53F0JWT\u5BC6\u94A5\uFF08\u81F3\u5C1132\u5B57\u8282\uFF09"),
  bullet("MERCHANT_JWT_SECRET: \u5546\u6237\u5E73\u53F0JWT\u5BC6\u94A5\uFF08\u81F3\u5C1132\u5B57\u8282\uFF09"),
  h2("4.3 \u6784\u5EFA\u9879\u76EE"),
  p("\u6784\u5EFA\u540E\u7AEF\uFF1A"),
  codeBlock("./mvnw clean package -DskipTests"),
  p("\u6784\u5EFA\u524D\u7AEF\uFF1A"),
  codeBlock("npm --prefix jeepay-ui install"),
  codeBlock("npm --prefix jeepay-ui run build"),
  h2("4.4 Docker\u90E8\u7F72"),
  p("\u542F\u52A8\u6240\u6709\u670D\u52A1\uFF1A"),
  codeBlock("docker compose --env-file .env up --build -d"),
  p("\u67E5\u770B\u670D\u52A1\u72B6\u6001\uFF1A"),
  codeBlock("docker compose ps"),
  h2("4.5 \u9A8C\u8BC1\u90E8\u7F72"),
  p("\u90E8\u7F72\u6210\u529F\u540E\uFF0C\u53EF\u8BBF\u95EE\u4EE5\u4E0B\u5730\u5740\u9A8C\u8BC1\uFF1A"),
  makeTable(
    ["\u670D\u52A1", "\u8BBF\u95EE\u5730\u5740"],
    [
      ["\u8FD0\u8425\u5E73\u53F0", "http://localhost:9227"],
      ["\u5546\u6237\u5E73\u53F0", "http://localhost:9228"],
      ["\u652F\u4ED8\u7F51\u5173\u5065\u5EB7\u68C0\u67E5", "http://localhost:9216/actuator/health"],
      ["ActiveMQ\u63A7\u5236\u53F0", "http://localhost:8161"],
    ],
    [2400, 6626]
  ),
  p("\u8FD0\u8425\u5E73\u53F0\u9ED8\u8BA4\u8D26\u53F7\uFF1A"),
  codeBlock("\u7528\u6237\u540D: admin  \u5BC6\u7801: admin123"),
];

// Chapter 5
const ch5 = [
  new Paragraph({ children: [new PageBreak()] }),
  h1("\u7B2C\u4E94\u7AE0  \u8FD0\u8425\u5E73\u53F0\u4F7F\u7528\u6307\u5357"),
  h2("5.1 \u767B\u5F55\u7CFB\u7EDF"),
  p("\u8BBF\u95EE http://localhost:9227 \uFF0C\u4F7F\u7528\u8D85\u7EA7\u7BA1\u7406\u5458\u8D26\u53F7 admin / admin123 \u767B\u5F55\u3002"),
  h2("5.2 \u5546\u6237\u7BA1\u7406"),
  h3("5.2.1 \u65B0\u5EFA\u5546\u6237"),
  numberedItem("\u70B9\u51FB\u5DE6\u4FA7\u83DC\u5355\u201C\u5546\u6237\u7BA1\u7406\u201D > \u201C\u5546\u6237\u5217\u8868\u201D"),
  numberedItem("\u70B9\u51FB\u201C\u65B0\u589E\u201D\u6309\u94AE"),
  numberedItem("\u586B\u5199\u5546\u6237\u540D\u79F0\u3001\u8054\u7CFB\u65B9\u5F0F\u7B49\u4FE1\u606F"),
  numberedItem("\u9009\u62E9\u5546\u6237\u7C7B\u578B\uFF1A\u666E\u901A\u5546\u6237\u6216\u7279\u7EA6\u5546\u6237"),
  numberedItem("\u4FDD\u5B58\u540E\u7CFB\u7EDF\u81EA\u52A8\u751F\u6210\u5546\u6237\u53F7(mchNo)"),
  h3("5.2.2 \u521B\u5EFA\u5546\u6237\u5E94\u7528"),
  numberedItem("\u8FDB\u5165\u5546\u6237\u8BE6\u60C5\u9875\uFF0C\u70B9\u51FB\u201C\u5E94\u7528\u5217\u8868\u201D\u680F\u5361"),
  numberedItem("\u70B9\u51FB\u201C\u65B0\u589E\u201D\u6309\u94AE\u521B\u5EFA\u5E94\u7528"),
  numberedItem("\u7CFB\u7EDF\u81EA\u52A8\u751F\u6210appId\u548CappSecret\uFF0C\u7528\u4E8E\u652F\u4ED8\u63A5\u53E3\u7B7E\u540D"),
  numberedItem("\u8BB0\u5F55appId\u548CappSecret\uFF0C\u4EA4\u4ED8\u7ED9\u5546\u6237"),
  h3("5.2.3 \u914D\u7F6E\u652F\u4ED8\u901A\u9053"),
  numberedItem("\u5728\u5546\u6237\u5E94\u7528\u8BE6\u60C5\u4E2D\uFF0C\u70B9\u51FB\u201C\u652F\u4ED8\u901A\u9053\u201D"),
  numberedItem("\u70B9\u51FB\u201C\u914D\u7F6E\u201D\u9009\u62E9\u9700\u8981\u5F00\u901A\u7684\u652F\u4ED8\u65B9\u5F0F"),
  numberedItem("\u586B\u5199\u6E20\u9053\u53C2\u6570\uFF08\u5982\u652F\u4ED8\u5B9DAPPID\u3001\u5546\u6237\u79C1\u94A5\u7B49\uFF09"),
  numberedItem("\u8BBE\u7F6E\u8D39\u7387\uFF08\u6BCF\u7B14\u4EA4\u6613\u7684\u624B\u7EED\u8D39\u767E\u5206\u6BD4\uFF09"),
  numberedItem("\u4FDD\u5B58\u540E\u751F\u6548"),
  h2("5.3 \u670D\u52A1\u5546\u7BA1\u7406"),
  p("\u670D\u52A1\u5546(ISV)\u6A21\u5F0F\u652F\u6301\u591A\u7EA7\u5546\u6237\u4F53\u7CFB\u3002\u7279\u7EA6\u5546\u6237\u53EF\u4EE5\u6302\u9760\u5728\u670D\u52A1\u5546\u4E0B\uFF0C\u5171\u4EAB\u670D\u52A1\u5546\u7684\u652F\u4ED8\u53C2\u6570\u3002"),
  numberedItem("\u70B9\u51FB\u201C\u670D\u52A1\u5546\u7BA1\u7406\u201D > \u201C\u670D\u52A1\u5546\u5217\u8868\u201D"),
  numberedItem("\u65B0\u5EFA\u670D\u52A1\u5546\u5E76\u586B\u5199\u76F8\u5173\u4FE1\u606F"),
  numberedItem("\u914D\u7F6E\u670D\u52A1\u5546\u7684\u652F\u4ED8\u63A5\u53E3\u53C2\u6570"),
  numberedItem("\u5C06\u7279\u7EA6\u5546\u6237\u5173\u8054\u5230\u670D\u52A1\u5546"),
  h2("5.4 \u8BA2\u5355\u7BA1\u7406"),
  p("\u8FD0\u8425\u5E73\u53F0\u53EF\u67E5\u770B\u6240\u6709\u5546\u6237\u7684\u652F\u4ED8\u8BA2\u5355\u3001\u9000\u6B3E\u8BA2\u5355\u3001\u8F6C\u8D26\u8BA2\u5355\u3002"),
  bullet("\u652F\u6301\u6309\u5546\u6237\u3001\u8BA2\u5355\u53F7\u3001\u72B6\u6001\u3001\u65F6\u95F4\u8303\u56F4\u7B49\u6761\u4EF6\u7B5B\u9009"),
  bullet("\u652F\u6301\u5BFC\u51FA\u8BA2\u5355\u6570\u636E"),
  bullet("\u652F\u6301\u67E5\u770B\u8BA2\u5355\u8BE6\u60C5\uFF08\u5305\u62EC\u6E20\u9053\u8BF7\u6C42/\u54CD\u5E94\u6570\u636E\u5FEB\u7167\uFF09"),
  h2("5.5 \u7CFB\u7EDF\u914D\u7F6E"),
  p("\u201C\u7CFB\u7EDF\u914D\u7F6E\u201D\u7528\u4E8E\u7BA1\u7406\u5168\u5C40\u53C2\u6570\uFF0C\u5305\u62EC\uFF1A"),
  bullet("\u8FD0\u8425\u5E73\u53F0/\u5546\u6237\u5E73\u53F0/\u652F\u4ED8\u7F51\u5173 URL\u5730\u5740"),
  bullet("OSS\u5BF9\u8C61\u5B58\u50A8\u5730\u5740"),
  bullet("\u5546\u6237\u901A\u77E5URL\u9ED8\u8BA4\u503C"),
  p("\u4FEE\u6539\u914D\u7F6E\u540E\uFF0C\u7CFB\u7EDF\u4F1A\u901A\u8FC7MQ\u5E7F\u64AD\u6D88\u606F\u81EA\u52A8\u5237\u65B0\u6240\u6709\u8282\u70B9\u7684\u914D\u7F6E\u7F13\u5B58\u3002"),
  h2("5.6 \u7528\u6237\u4E0E\u6743\u9650\u7BA1\u7406"),
  h3("5.6.1 \u89D2\u8272\u7BA1\u7406"),
  p("\u7CFB\u7EDF\u9884\u7F6E\u4E24\u4E2A\u89D2\u8272\uFF1AROLE_ADMIN\uFF08\u7CFB\u7EDF\u7BA1\u7406\u5458\uFF09\u548CROLE_OP\uFF08\u666E\u901A\u64CD\u4F5C\u5458\uFF09\u3002\u53EF\u4EE5\u81EA\u5B9A\u4E49\u65B0\u89D2\u8272\u5E76\u5206\u914D\u6743\u9650\u3002"),
  h3("5.6.2 \u64CD\u4F5C\u5458\u7BA1\u7406"),
  p("\u652F\u6301\u521B\u5EFA\u591A\u4E2A\u64CD\u4F5C\u5458\u8D26\u53F7\uFF0C\u5206\u914D\u4E0D\u540C\u89D2\u8272\u3002\u7CFB\u7EDF\u652F\u6301\u7528\u6237\u540D/\u624B\u673A\u53F7/\u5FAE\u4FE1/QQ\u591A\u79CD\u767B\u5F55\u65B9\u5F0F\u3002"),
];

// Chapter 6
const ch6 = [
  new Paragraph({ children: [new PageBreak()] }),
  h1("\u7B2C\u516D\u7AE0  \u5546\u6237\u5E73\u53F0\u4F7F\u7528\u6307\u5357"),
  h2("6.1 \u767B\u5F55\u5546\u6237\u5E73\u53F0"),
  p("\u8BBF\u95EE http://localhost:9228 \uFF0C\u4F7F\u7528\u8FD0\u8425\u5E73\u53F0\u521B\u5EFA\u7684\u5546\u6237\u8D26\u53F7\u767B\u5F55\u3002"),
  h2("6.2 \u914D\u7F6E\u652F\u4ED8\u53C2\u6570"),
  p("\u5546\u6237\u53EF\u4EE5\u81EA\u884C\u7BA1\u7406\u5E94\u7528\u548C\u652F\u4ED8\u901A\u9053\u914D\u7F6E\uFF1A"),
  bullet("\u67E5\u770B\u5DF2\u521B\u5EFA\u7684\u5E94\u7528\u53CA\u5176appId\u3001appSecret"),
  bullet("\u914D\u7F6E\u5404\u652F\u4ED8\u65B9\u5F0F\u7684\u6E20\u9053\u53C2\u6570\uFF08\u5982\u652F\u4ED8\u5B9D\u79C1\u94A5\u3001\u5FAE\u4FE1\u5546\u6237\u53F7\u7B49\uFF09"),
  bullet("\u8BBE\u7F6E\u652F\u4ED8\u901A\u9053\u7684\u8D39\u7387"),
  h2("6.3 \u8BA2\u5355\u7BA1\u7406"),
  p("\u5546\u6237\u53EF\u4EE5\u67E5\u770B\u81EA\u5DF1\u7684\u6240\u6709\u8BA2\u5355\uFF1A"),
  bullet("\u652F\u4ED8\u8BA2\u5355\uFF1A\u67E5\u770B\u652F\u4ED8\u72B6\u6001\u3001\u91D1\u989D\u3001\u652F\u4ED8\u65B9\u5F0F\u7B49"),
  bullet("\u9000\u6B3E\u8BA2\u5355\uFF1A\u53D1\u8D77\u9000\u6B3E\u3001\u67E5\u770B\u9000\u6B3E\u8FDB\u5EA6"),
  bullet("\u8F6C\u8D26\u8BA2\u5355\uFF1A\u53D1\u8D77\u8F6C\u8D26\u3001\u67E5\u770B\u8F6C\u8D26\u7ED3\u679C"),
  h2("6.4 \u5206\u8D26\u7BA1\u7406"),
  p("\u652F\u6301\u8BA2\u5355\u5206\u8D26\u529F\u80FD\uFF0C\u5141\u8BB8\u5546\u6237\u5C06\u4E00\u7B14\u652F\u4ED8\u8BA2\u5355\u7684\u91D1\u989D\u5206\u914D\u7ED9\u591A\u4E2A\u63A5\u6536\u8005\uFF1A"),
  numberedItem("\u521B\u5EFA\u5206\u8D26\u63A5\u6536\u8005\u7EC4\uFF08\u53EF\u5305\u542B\u591A\u4E2A\u63A5\u6536\u8005\uFF09"),
  numberedItem("\u6DFB\u52A0\u5206\u8D26\u63A5\u6536\u8005\uFF08\u8D26\u53F7\u3001\u59D3\u540D\u3001\u5206\u8D26\u6BD4\u4F8B\uFF09"),
  numberedItem("\u5728\u652F\u4ED8\u8BA2\u5355\u8BE6\u60C5\u4E2D\u6267\u884C\u5206\u8D26"),
  numberedItem("\u67E5\u770B\u5206\u8D26\u8BB0\u5F55\u548C\u72B6\u6001"),
  h2("6.5 \u652F\u4ED8\u6D4B\u8BD5"),
  p("\u5546\u6237\u5E73\u53F0\u63D0\u4F9B\u652F\u4ED8\u6D4B\u8BD5\u529F\u80FD\uFF0C\u65B9\u4FBF\u5546\u6237\u5728\u4E0A\u7EBF\u524D\u9A8C\u8BC1\u652F\u4ED8\u914D\u7F6E\u662F\u5426\u6B63\u786E\uFF1A"),
  bullet("\u53D1\u8D77\u6D4B\u8BD5\u652F\u4ED8"),
  bullet("\u6A21\u62DF\u652F\u4ED8\u56DE\u8C03"),
  bullet("\u67E5\u770B\u6D4B\u8BD5\u8BA2\u5355\u72B6\u6001"),
  bullet("\u53D1\u8D77\u6D4B\u8BD5\u9000\u6B3E"),
  h2("6.6 \u4E3B\u9875\u7EDF\u8BA1"),
  p("\u5546\u6237\u5E73\u53F0\u9996\u9875\u63D0\u4F9B\u5173\u952E\u4E1A\u52A1\u6570\u636E\u7684\u53EF\u89C6\u5316\u5C55\u793A\uFF1A"),
  bullet("\u4ECA\u65E5\u4EA4\u6613\u7B14\u6570\u548C\u4EA4\u6613\u989D"),
  bullet("\u652F\u4ED8\u8D8B\u52BF\u56FE\u8868"),
  bullet("\u652F\u4ED8\u65B9\u5F0F\u5206\u5E03"),
];

// Chapter 7
const ch7 = [
  new Paragraph({ children: [new PageBreak()] }),
  h1("\u7B2C\u4E03\u7AE0  \u652F\u4ED8\u7F51\u5173API\u63A5\u53E3"),
  h2("7.1 \u63A5\u53E3\u8BA4\u8BC1"),
  p("\u652F\u4ED8\u7F51\u5173\u4F7F\u7528\u5546\u6237\u7B7E\u540D\u9A8C\u8BC1\u65B9\u5F0F\u3002\u6BCF\u6B21\u8BF7\u6C42\u9700\u8981\u643A\u5E26\u4EE5\u4E0B\u53C2\u6570\uFF1A"),
  makeTable(
    ["\u53C2\u6570", "\u7C7B\u578B", "\u5FC5\u586B", "\u8BF4\u660E"],
    [
      ["mchNo", "String", "\u662F", "\u5546\u6237\u53F7"],
      ["appId", "String", "\u662F", "\u5E94\u7528ID"],
      ["signType", "String", "\u662F", "\u7B7E\u540D\u7C7B\u578B\uFF08\u56FA\u5B9A\u4E3AMD5\uFF09"],
      ["sign", "String", "\u662F", "MD5\u7B7E\u540D\u503C"],
    ],
    [1600, 1200, 1000, 5226]
  ),
  p("\u7B7E\u540D\u8BA1\u7B97\u65B9\u5F0F\uFF1A\u5C06\u8BF7\u6C42\u53C2\u6570\uFF08\u9664sign\u5916\uFF09\u6392\u5E8F\u540E\u62FC\u63A5\u6210\u5B57\u7B26\u4E32\uFF0C\u8FFD\u52A0appSecret\u540E\u8FDB\u884CMD5\u52A0\u5BC6\u3002"),
  h2("7.2 \u7EDF\u4E00\u4E0B\u5355"),
  p("\u63A5\u53E3\u5730\u5740\uFF1A"),
  codeBlock("POST /api/pay/unifiedOrder"),
  p("\u8BF7\u6C42\u53C2\u6570\uFF1A"),
  makeTable(
    ["\u53C2\u6570", "\u7C7B\u578B", "\u5FC5\u586B", "\u8BF4\u660E"],
    [
      ["mchNo", "String", "\u662F", "\u5546\u6237\u53F7"],
      ["appId", "String", "\u662F", "\u5E94\u7528ID"],
      ["mchOrderNo", "String", "\u662F", "\u5546\u6237\u8BA2\u5355\u53F7"],
      ["wayCode", "String", "\u662F", "\u652F\u4ED8\u65B9\u5F0F\u4EE3\u7801 (ALI_BAR/WX_JSAPI\u7B49)"],
      ["amount", "Long", "\u662F", "\u652F\u4ED8\u91D1\u989D (\u5355\u4F4D\uFF1A\u5206)"],
      ["currency", "String", "\u662F", "\u8D27\u5E01\u4EE3\u7801 (cny)"],
      ["subject", "String", "\u662F", "\u5546\u54C1\u6807\u9898"],
      ["body", "String", "\u662F", "\u5546\u54C1\u63CF\u8FF0"],
      ["notifyUrl", "String", "\u5426", "\u5546\u6237\u901A\u77E5\u5730\u5740"],
      ["returnUrl", "String", "\u5426", "\u9875\u9762\u8DF3\u8F6C\u5730\u5740"],
      ["channelExtra", "String", "\u5426", "\u6E20\u9053\u6269\u5C55\u53C2\u6570 (JSON)"],
      ["reqTime", "Long", "\u662F", "\u8BF7\u6C42\u65F6\u95F4\u6233"],
      ["version", "String", "\u662F", "\u63A5\u53E3\u7248\u672C (1.0)"],
      ["sign", "String", "\u662F", "\u7B7E\u540D\u503C"],
      ["signType", "String", "\u662F", "\u7B7E\u540D\u7C7B\u578B (MD5)"],
    ],
    [1600, 1200, 1000, 5226]
  ),
  p("\u54CD\u5E94\u53C2\u6570\uFF1A"),
  makeTable(
    ["\u53C2\u6570", "\u7C7B\u578B", "\u8BF4\u660E"],
    [
      ["payOrderId", "String", "\u5E73\u53F0\u652F\u4ED8\u8BA2\u5355\u53F7"],
      ["mchOrderNo", "String", "\u5546\u6237\u8BA2\u5355\u53F7"],
      ["orderState", "Integer", "\u8BA2\u5355\u72B6\u6001 (1-\u6210\u529F 2-\u5931\u8D25 3-\u652F\u4ED8\u4E2D)"],
      ["payData", "String", "\u652F\u4ED8\u6570\u636E (\u4E8C\u7EF4\u7801\u94FE\u63A5/H5\u8DF3\u8F6CURL\u7B49)"],
    ],
    [2000, 1200, 5826]
  ),
  h2("7.3 \u8BA2\u5355\u67E5\u8BE2"),
  p("\u63A5\u53E3\u5730\u5740\uFF1A"),
  codeBlock("POST /api/pay/queryOrder"),
  p("\u53C2\u6570\uFF1ApayOrderId\uFF08\u5E73\u53F0\u8BA2\u5355\u53F7\uFF09\u6216mchOrderNo\uFF08\u5546\u6237\u8BA2\u5355\u53F7\uFF09\uFF0C\u8FD4\u56DE\u8BA2\u5355\u5F53\u524D\u72B6\u6001\u3002"),
  h2("7.4 \u5173\u95ED\u8BA2\u5355"),
  p("\u63A5\u53E3\u5730\u5740\uFF1A"),
  codeBlock("POST /api/pay/closeOrder"),
  p("\u5173\u95ED\u672A\u652F\u4ED8\u7684\u8BA2\u5355\uFF0C\u53C2\u6570\u4E3ApayOrderId\u6216mchOrderNo\u3002"),
  h2("7.5 \u53D1\u8D77\u9000\u6B3E"),
  p("\u63A5\u53E3\u5730\u5740\uFF1A"),
  codeBlock("POST /api/refund/refundOrder"),
  p("\u53C2\u6570\u5305\u62ECpayOrderId\u3001mchRefundNo\u3001refundAmount\u7B49\uFF0C\u8FD4\u56DE\u9000\u6B3E\u8BA2\u5355\u53F7\u548C\u72B6\u6001\u3002"),
  h2("7.6 \u53D1\u8D77\u8F6C\u8D26"),
  p("\u63A5\u53E3\u5730\u5740\uFF1A"),
  codeBlock("POST /api/transferOrder"),
  p("\u53C2\u6570\u5305\u62ECmchOrderNo\u3001amount\u3001accountNo\u3001accountName\u7B49\uFF0C\u8FD4\u56DE\u8F6C\u8D26\u8BA2\u5355\u53F7\u548C\u72B6\u6001\u3002"),
  h2("7.7 \u56DE\u8C03\u901A\u77E5"),
  p("\u652F\u4ED8\u6210\u529F\u540E\uFF0C\u7CFB\u7EDF\u4F1A\u901A\u8FC7MQ\u5F02\u6B65\u5411\u5546\u6237\u914D\u7F6E\u7684notifyUrl\u53D1\u9001HTTP POST\u901A\u77E5\u3002\u901A\u77E5\u5185\u5BB9\u5305\u542B\u8BA2\u5355\u4FE1\u606F\u548C\u7B7E\u540D\uFF0C\u5546\u6237\u9700\u8981\u9A8C\u7B7E\u5E76\u8FD4\u56DE\u201Csuccess\u201D\u5B57\u7B26\u4E32\u3002"),
  h2("7.8 \u652F\u4ED8\u65B9\u5F0F\u4EE3\u7801"),
  makeTable(
    ["\u4EE3\u7801", "\u540D\u79F0", "\u6E20\u9053"],
    [
      ["ALI_BAR", "\u652F\u4ED8\u5B9D\u6761\u7801\u652F\u4ED8", "\u652F\u4ED8\u5B9D"],
      ["ALI_JSAPI", "\u652F\u4ED8\u5B9D\u751F\u6D3B\u53F7\u652F\u4ED8", "\u652F\u4ED8\u5B9D"],
      ["ALI_WAP", "\u652F\u4ED8\u5B9DWAP\u652F\u4ED8", "\u652F\u4ED8\u5B9D"],
      ["ALI_APP", "\u652F\u4ED8\u5B9DAPP\u652F\u4ED8", "\u652F\u4ED8\u5B9D"],
      ["ALI_PC", "\u652F\u4ED8\u5B9DPC\u7F51\u7AD9\u652F\u4ED8", "\u652F\u4ED8\u5B9D"],
      ["ALI_QR", "\u652F\u4ED8\u5B9D\u4E8C\u7EF4\u7801", "\u652F\u4ED8\u5B9D"],
      ["WX_BAR", "\u5FAE\u4FE1\u6761\u7801\u652F\u4ED8", "\u5FAE\u4FE1\u652F\u4ED8"],
      ["WX_JSAPI", "\u5FAE\u4FE1\u516C\u4F17\u53F7\u652F\u4ED8", "\u5FAE\u4FE1\u652F\u4ED8"],
      ["WX_H5", "\u5FAE\u4FE1H5\u652F\u4ED8", "\u5FAE\u4FE1\u652F\u4ED8"],
      ["WX_NATIVE", "\u5FAE\u4FE1\u539F\u751F\u4E8C\u7EF4\u7801", "\u5FAE\u4FE1\u652F\u4ED8"],
      ["WX_APP", "\u5FAE\u4FE1APP\u652F\u4ED8", "\u5FAE\u4FE1\u652F\u4ED8"],
      ["YSF_BAR", "\u4E91\u95EA\u4ED8\u6761\u7801\u652F\u4ED8", "\u4E91\u95EA\u4ED8"],
      ["PP_PC", "PayPal PC\u7F51\u7AD9\u652F\u4ED8", "PayPal"],
      ["QR_CASHIER", "\u805A\u5408\u7801\u6536\u94F6\u53F0", "\u591A\u6E20\u9053"],
    ],
    [2200, 2800, 4026]
  ),
];

// Chapter 8
const ch8 = [
  new Paragraph({ children: [new PageBreak()] }),
  h1("\u7B2C\u516B\u7AE0  \u914D\u7F6E\u8BF4\u660E"),
  h2("8.1 \u73AF\u5883\u53D8\u91CF\u8BE6\u89E3"),
  makeTable(
    ["\u53D8\u91CF", "\u8BF4\u660E", "\u9ED8\u8BA4\u503C"],
    [
      ["MYSQL_ROOT_PASSWORD", "MySQL root\u5BC6\u7801", "\u5FC5\u586B"],
      ["MYSQL_DATABASE", "\u6570\u636E\u5E93\u540D\u79F0", "openhubsdb"],
      ["MYSQL_USER", "\u5E94\u7528\u6570\u636E\u5E93\u7528\u6237", "openhubs"],
      ["MYSQL_PASSWORD", "\u5E94\u7528\u6570\u636E\u5E93\u5BC6\u7801", "\u5FC5\u586B"],
      ["ACTIVEMQ_USER", "ActiveMQ\u7528\u6237\u540D", "admin"],
      ["ACTIVEMQ_PASSWORD", "ActiveMQ\u5BC6\u7801", "admin"],
      ["MANAGER_JWT_SECRET", "\u8FD0\u8425\u5E73\u53F0JWT\u5BC6\u94A5", "\u5FC5\u586B\uFF0C\u226532\u5B57\u8282"],
      ["MERCHANT_JWT_SECRET", "\u5546\u6237\u5E73\u53F0JWT\u5BC6\u94A5", "\u5FC5\u586B\uFF0C\u226532\u5B57\u8282"],
      ["OPENHUBS_CORS_ALLOWED_ORIGINS", "CORS\u5141\u8BB8\u7684\u6E90", "\u524D\u7AEF\u5730\u5740"],
      ["ALIYUN_OSS_ACCESS_KEY_ID", "\u963F\u91CC\u4E91OSS Key", "\u53EF\u9009"],
      ["ALIYUN_OSS_ACCESS_KEY_SECRET", "\u963F\u91CC\u4E91OSS Secret", "\u53EF\u9009"],
    ],
    [3600, 3000, 2426]
  ),
  h2("8.2 \u6570\u636E\u5E93\u914D\u7F6E"),
  p("\u6570\u636E\u5E93\u914D\u7F6E\u4F4D\u4E8E conf/\u6A21\u5757\u540D/application.yml\u3002\u4E3B\u8981\u914D\u7F6E\u9879\uFF1A"),
  bullet("\u8FDE\u63A5\u6C60\uFF1ADruid\u8FDE\u63A5\u6C60\uFF0C\u9ED8\u8BA4\u6700\u592730\u4E2A\u8FDE\u63A5"),
  bullet("\u8FDE\u63A5\u5730\u5740\uFF1A\u9ED8\u8BA4\u8FDE\u63A5\u672C\u5730MySQL 3306\u7AEF\u53E3"),
  bullet("\u6570\u636E\u5E93\u540D\uFF1A\u9ED8\u8BA4openhubsdb"),
  h2("8.3 Redis\u914D\u7F6E"),
  p("\u4E0D\u540C\u6A21\u5757\u4F7F\u7528\u4E0D\u540C\u7684Redis DB\u7D22\u5F15\uFF1A"),
  bullet("manager\u6A21\u5757\u4F7F\u7528 DB 1"),
  bullet("merchant\u6A21\u5757\u4F7F\u7528 DB 2"),
  bullet("payment\u6A21\u5757\u4F7F\u7528 DB 3"),
  h2("8.4 ActiveMQ\u914D\u7F6E"),
  p("ActiveMQ\u91C7\u7528 failover \u8FDE\u63A5\u6A21\u5F0F\uFF0C\u63D0\u4F9B\u9AD8\u53EF\u7528\u4FDD\u969C\u3002\u8FDE\u63A5\u6C60\u9ED8\u8BA4\u6700\u592710\u4E2A\u8FDE\u63A5\u3002\u6D88\u606F\u6A21\u5F0F\u5305\u62EC\uFF1A"),
  bullet("QUEUE\uFF08\u70B9\u5BF9\u70B9\uFF09\uFF1A\u7528\u4E8E\u5546\u6237\u901A\u77E5\u3001\u8BA2\u5355\u8865\u507F\u3001\u8BA2\u5355\u5206\u8D26"),
  bullet("BROADCAST\uFF08\u5E7F\u64AD\uFF09\uFF1A\u7528\u4E8E\u914D\u7F6E\u7F13\u5B58\u5237\u65B0\u3001\u8BA4\u8BC1\u7F13\u5B58\u6E05\u7406"),
  h2("8.5 OSS\u5B58\u50A8\u914D\u7F6E"),
  p("\u652F\u6301\u4E24\u79CD\u5B58\u50A8\u6A21\u5F0F\uFF1A"),
  bullet("\u672C\u5730\u5B58\u50A8\uFF1A\u6587\u4EF6\u5B58\u50A8\u5728\u670D\u52A1\u5668\u672C\u5730\u76EE\u5F55"),
  bullet("\u963F\u91CC\u4E91OSS\uFF1A\u9700\u8981\u914D\u7F6Eaccess-key-id\u548Caccess-key-secret"),
];

// Chapter 9
const ch9 = [
  new Paragraph({ children: [new PageBreak()] }),
  h1("\u7B2C\u4E5D\u7AE0  \u5E38\u89C1\u95EE\u9898"),
  h2("9.1 \u90E8\u7F72\u95EE\u9898"),
  h3("Q: Docker\u542F\u52A8\u5931\u8D25\uFF0C\u63D0\u793A\u201Cno configuration file provided\u201D"),
  p("A: \u786E\u4FDD\u5DF2\u590D\u5236 .env.example \u4E3A .env \u5E76\u4FEE\u6539\u4E86\u5FC5\u586B\u9879\uFF0C\u7136\u540E\u4F7F\u7528 --env-file .env \u53C2\u6570\u542F\u52A8\u3002"),
  h3("Q: MySQL\u8FDE\u63A5\u5931\u8D25"),
  p("A: \u68C0\u67E5 .env \u6587\u4EF6\u4E2D\u7684 MYSQL_ROOT_PASSWORD \u662F\u5426\u4E0E\u542F\u52A8\u65F6\u4E00\u81F4\u3002\u5982\u679C\u66F4\u6539\u4E86\u5BC6\u7801\uFF0C\u9700\u8981\u5148\u5220\u9664\u5DF2\u6709\u7684MySQL\u5BB9\u5668\u548C\u6570\u636E\u5377\u3002"),
  h3("Q: \u7AEF\u53E3\u88AB\u5360\u7528"),
  p("A: \u68C0\u67E5 3306\u30016379\u30019216\u30019217\u30019218 \u7B49\u7AEF\u53E3\u662F\u5426\u5DF2\u88AB\u5176\u4ED6\u7A0B\u5E8F\u5360\u7528\u3002\u53EF\u4F7F\u7528 docker compose down \u505C\u6B62\u5DF2\u6709\u670D\u52A1\u540E\u91CD\u8BD5\u3002"),
  h2("9.2 \u652F\u4ED8\u95EE\u9898"),
  h3("Q: \u7EDF\u4E00\u4E0B\u5355\u8FD4\u56DE\u201C\u7B7E\u540D\u9A8C\u8BC1\u5931\u8D25\u201D"),
  p("A: \u68C0\u67E5\u4EE5\u4E0B\u51E0\u70B9\uFF1A"),
  bullet("appId\u548CappSecret\u662F\u5426\u6B63\u786E"),
  bullet("\u7B7E\u540D\u8BA1\u7B97\u7B97\u6CD5\u662F\u5426\u6B63\u786E\uFF08\u53C2\u6570\u6392\u5E8F\u540EMD5\uFF09"),
  bullet("\u8BF7\u6C42\u53C2\u6570\u662F\u5426\u5B8C\u6574"),
  h3("Q: \u652F\u4ED8\u540E\u5546\u6237\u6CA1\u6709\u6536\u5230\u901A\u77E5"),
  p("A: \u68C0\u67E5\u4EE5\u4E0B\u51E0\u70B9\uFF1A"),
  bullet("\u5546\u6237\u5E94\u7528\u7684\u901A\u77E5URL\u662F\u5426\u914D\u7F6E\u6B63\u786E"),
  bullet("ActiveMQ\u670D\u52A1\u662F\u5426\u6B63\u5E38\u8FD0\u884C"),
  bullet("\u901A\u77E5\u5730\u5740\u662F\u5426\u53EF\u4ECE\u670D\u52A1\u5668\u8BBF\u95EE"),
  h3("Q: \u5FAE\u4FE1\u652F\u4ED8\u8FD4\u56DE\u201Cappid and openid not match\u201D"),
  p("A: \u5FAE\u4FE1JSAPI\u652F\u4ED8\u9700\u8981\u4F20\u5165\u6B63\u786E\u7684openid\u3002\u53EF\u4F7F\u7528\u83B7\u53D6\u6E20\u9053\u7528\u6237ID\u63A5\u53E3 GET /api/qrcode/channelUserId \u83B7\u53D6\u7528\u6237\u7684openid\u3002"),
  h2("9.3 \u767B\u5F55\u95EE\u9898"),
  h3("Q: \u767B\u5F55\u540E\u5F88\u5FEB\u5C31\u8FC7\u671F"),
  p("A: JWT Token\u6709\u6548\u671F\u4E3A2\u5C0F\u65F6\u3002\u6BCF\u6B21\u8BF7\u6C42\u4F1A\u81EA\u52A8\u7EED\u671F\u3002\u5982\u679C\u4ECD\u7136\u9891\u7E41\u8FC7\u671F\uFF0C\u68C0\u67E5Redis\u670D\u52A1\u662F\u5426\u6B63\u5E38\u3002"),
  h3("Q: \u7528\u6237\u540D\u5BC6\u7801\u9519\u8BEF\u591A\u6B21\u540E\u88AB\u9501\u5B9A"),
  p("A: \u9ED8\u8BA4\u8FDE\u7EED5\u6B21\u5BC6\u7801\u9519\u8BEF\u540E\u8D26\u53F7\u4F1A\u88AB\u9501\u5B9A30\u5206\u949F\u3002\u53EF\u4EE5\u5728\u7CFB\u7EDF\u914D\u7F6E\u4E2D\u8C03\u6574\u3002"),
];

// Chapter 10
const ch10 = [
  new Paragraph({ children: [new PageBreak()] }),
  h1("\u7B2C\u5341\u7AE0  \u9644\u5F55"),
  h2("10.1 \u6570\u636E\u5E93\u8868\u7ED3\u6784"),
  p("\u7CFB\u7EDF\u5305\u542B16\u5F20\u6570\u636E\u5E93\u8868\uFF0C\u5206\u4E3A\u4EE5\u4E0B\u7C7B\u522B\uFF1A"),
  makeTable(
    ["\u8868\u540D", "\u5206\u7C7B", "\u8BF4\u660E"],
    [
      ["t_sys_user", "RBAC", "\u7CFB\u7EDF\u7528\u6237\u8868"],
      ["t_sys_user_auth", "RBAC", "\u7528\u6237\u8BA4\u8BC1\u8868 (\u652F\u6301\u591A\u79CD\u767B\u5F55\u65B9\u5F0F)"],
      ["t_sys_role", "RBAC", "\u89D2\u8272\u8868"],
      ["t_sys_entitlement", "RBAC", "\u6743\u9650/\u83DC\u5355\u8868"],
      ["t_sys_role_ent_rela", "RBAC", "\u89D2\u8272-\u6743\u9650\u5173\u8054\u8868"],
      ["t_sys_user_role_rela", "RBAC", "\u7528\u6237-\u89D2\u8272\u5173\u8054\u8868"],
      ["t_sys_config", "\u7CFB\u7EDF", "\u7CFB\u7EDF\u914D\u7F6E\u8868"],
      ["t_sys_log", "\u7CFB\u7EDF", "\u64CD\u4F5C\u65E5\u5FD7\u8868"],
      ["t_mch_info", "\u5546\u6237", "\u5546\u6237\u4FE1\u606F\u8868"],
      ["t_mch_app", "\u5546\u6237", "\u5546\u6237\u5E94\u7528\u8868"],
      ["t_isv_info", "\u670D\u52A1\u5546", "\u670D\u52A1\u5546\u4FE1\u606F\u8868"],
      ["t_pay_way", "\u652F\u4ED8\u914D\u7F6E", "\u652F\u4ED8\u65B9\u5F0F\u8868"],
      ["t_pay_interface_define", "\u652F\u4ED8\u914D\u7F6E", "\u652F\u4ED8\u63A5\u53E3\u5B9A\u4E49\u8868"],
      ["t_pay_interface_config", "\u652F\u4ED8\u914D\u7F6E", "\u652F\u4ED8\u63A5\u53E3\u53C2\u6570\u914D\u7F6E"],
      ["t_mch_pay_passage", "\u652F\u4ED8\u914D\u7F6E", "\u5546\u6237\u652F\u4ED8\u901A\u9053\u8868"],
      ["t_pay_order", "\u8BA2\u5355", "\u652F\u4ED8\u8BA2\u5355\u8868"],
      ["t_refund_order", "\u8BA2\u5355", "\u9000\u6B3E\u8BA2\u5355\u8868"],
      ["t_transfer_order", "\u8BA2\u5355", "\u8F6C\u8D26\u8BA2\u5355\u8868"],
      ["t_mch_notify_record", "\u901A\u77E5", "\u5546\u6237\u901A\u77E5\u8BB0\u5F55\u8868"],
      ["t_order_snapshot", "\u8BA2\u5355", "\u8BA2\u5355\u63A5\u53E3\u6570\u636E\u5FEB\u7167"],
    ],
    [3200, 1600, 4226]
  ),
  h2("10.2 \u8BA2\u5355\u72B6\u6001\u8BF4\u660E"),
  makeTable(
    ["\u72B6\u6001\u7801", "\u72B6\u6001\u540D\u79F0", "\u8BF4\u660E"],
    [
      ["0", "\u8BA2\u5355\u751F\u6210", "\u8BA2\u5355\u5DF2\u521B\u5EFA\uFF0C\u672A\u53D1\u8D77\u652F\u4ED8"],
      ["1", "\u652F\u4ED8\u4E2D", "\u5DF2\u53D1\u8D77\u652F\u4ED8\uFF0C\u7B49\u5F85\u652F\u4ED8\u7ED3\u679C"],
      ["2", "\u652F\u4ED8\u6210\u529F", "\u652F\u4ED8\u6210\u529F"],
      ["3", "\u652F\u4ED8\u5931\u8D25", "\u652F\u4ED8\u5931\u8D25"],
      ["4", "\u5DF2\u64A4\u9500", "\u8BA2\u5355\u5DF2\u64A4\u9500"],
      ["5", "\u5DF2\u9000\u6B3E", "\u8BA2\u5355\u5DF2\u9000\u6B3E (\u90E8\u5206\u6216\u5168\u989D)"],
      ["6", "\u5DF2\u5173\u95ED", "\u8BA2\u5355\u5DF2\u5173\u95ED"],
    ],
    [1600, 2200, 5226]
  ),
  h2("10.3 \u6280\u672F\u652F\u6301"),
  p("\u5982\u9047\u5230\u5176\u4ED6\u95EE\u9898\uFF0C\u53EF\u901A\u8FC7\u4EE5\u4E0B\u6E20\u9053\u83B7\u53D6\u652F\u6301\uFF1A"),
  bullet("\u5B98\u65B9\u7F51\u7AD9\uFF1Ahttps://openhubs.pay"),
  bullet("GitHub\u4ED3\u5E93\uFF1Ahttps://github.com/qdshow3011/jeepay-plus"),
  bullet("\u67E5\u770B\u9879\u76EE\u8FD0\u884C\u65E5\u5FD7\uFF1Adocker compose logs -f [\u670D\u52A1\u540D]"),
  bullet("\u67E5\u770B\u6570\u636E\u5E93\u64CD\u4F5C\u65E5\u5FD7\uFF1At_sys_log\u8868"),
];

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font, size: fontSize }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font, color: "1F4E79" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font, color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font, color: "404040" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 }
      },
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
    ]
  },
  sections: [
    // Cover
    {
      properties: {
        page: {
          size: { width: A4_WIDTH, height: A4_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "OpenHubs PAY \u8F6F\u4EF6\u4F7F\u7528\u8BF4\u660E\u4E66", font, size: 18, color: "999999", italics: true })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "\u7B2C ", font, size: 18, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], font, size: 18, color: "999999" }),
              new TextRun({ text: " \u9875", font, size: 18, color: "999999" })]
          })]
        })
      },
      children: coverPage
    },
    // TOC
    {
      properties: {
        page: {
          size: { width: A4_WIDTH, height: A4_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "OpenHubs PAY \u8F6F\u4EF6\u4F7F\u7528\u8BF4\u660E\u4E66", font, size: 18, color: "999999", italics: true })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "\u7B2C ", font, size: 18, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], font, size: 18, color: "999999" }),
              new TextRun({ text: " \u9875", font, size: 18, color: "999999" })]
          })]
        })
      },
      children: tocPage
    },
    // Content sections
    ...[ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10].map(children => ({
      properties: {
        page: {
          size: { width: A4_WIDTH, height: A4_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "OpenHubs PAY \u8F6F\u4EF6\u4F7F\u7528\u8BF4\u660E\u4E66", font, size: 18, color: "999999", italics: true })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "\u7B2C ", font, size: 18, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], font, size: 18, color: "999999" }),
              new TextRun({ text: " \u9875", font, size: 18, color: "999999" })]
          })]
        })
      },
      children
    }))
  ]
});

const outPath = "C:/Users/Administrator/Documents/WorkBuddy/Github/jeepay-plus/OpenHubs_PAY_软件使用说明书.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log("Document generated: " + outPath);
});
