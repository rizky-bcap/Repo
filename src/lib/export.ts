import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export async function exportToDocx(title: string, content: any) {
    if (!content || !content.content) return;

    const sections = [];

    // Simple mapper from Tiptap JSON to docx Paragraphs
    const children = content.content.map((node: any) => {
        if (node.type === 'heading') {
            let level = HeadingLevel.HEADING_1;
            if (node.attrs?.level === 2) level = HeadingLevel.HEADING_2;
            if (node.attrs?.level === 3) level = HeadingLevel.HEADING_3;

            return new Paragraph({
                text: node.content?.map((c: any) => c.text).join('') || '',
                heading: level,
            });
        }

        if (node.type === 'paragraph') {
            const runs = node.content?.map((c: any) => {
                return new TextRun({
                    text: c.text || '',
                    bold: c.marks?.some((m: any) => m.type === 'bold'),
                    italics: c.marks?.some((m: any) => m.type === 'italic'),
                });
            }) || [];

            return new Paragraph({
                children: runs,
            });
        }

        if (node.type === 'blockquote') {
            return new Paragraph({
                text: node.content?.[0]?.content?.map((c: any) => c.text).join('') || '',
                // You can add more styling for blockquotes here
            });
        }

        return new Paragraph({ text: '' });
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: title,
                    heading: HeadingLevel.TITLE,
                    spacing: { after: 400 },
                }),
                ...children,
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title || 'document'}.docx`);
}
