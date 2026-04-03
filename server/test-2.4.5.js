const fs = require('fs');
const pdf = require('pdf-parse');
(async () => {
    try {
        const buffer = fs.readFileSync('sample.pdf');
        const data = await pdf.PDFParse(buffer);
        console.log("Success text length:", data.text.length);
    } catch(e) {
        console.error("Test Error:", e);
    }
})();
