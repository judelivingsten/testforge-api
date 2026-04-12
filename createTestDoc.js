const { Document, Preamble, Paragraph, TextRun, Packer } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ children: [new TextRun("User Story:")] }),
      new Paragraph({ children: [new TextRun("As a bank customer I want to transfer money between my accounts so that I can manage my finances easily.")] }),
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun("Acceptance Criteria:")] }),
      new Paragraph({ children: [new TextRun("- User can select source and destination account")] }),
      new Paragraph({ children: [new TextRun("- Minimum transfer amount is $1")] }),
      new Paragraph({ children: [new TextRun("- Maximum transfer amount is $10,000 per day")] }),
      new Paragraph({ children: [new TextRun("- User receives confirmation after successful transfer")] }),
      new Paragraph({ children: [new TextRun("- Balance cannot go below $0")] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('test-story.docx', buffer);
  console.log('test-story.docx created successfully!');
});
