// Reads the text of a PDF in the browser. The file is never uploaded: only
// what the user chooses to keep (a list of skills) is saved afterwards.
// The PDF library is large, so it is loaded only when someone picks a file.

const MAX_PAGES = 12;

export const readPdfText = async (file) => {
  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await task.promise;
  const pages = [];
  for (let number = 1; number <= Math.min(pdf.numPages, MAX_PAGES); number += 1) {
    const page = await pdf.getPage(number);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  await task.destroy();
  return pages.join("\n");
};

// "React, SQL" -> ["React", "SQL"], without blanks or duplicates.
export const splitSkills = (text) => {
  const seen = new Set();
  return String(text || "")
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter((skill) => skill && !seen.has(skill.toLowerCase()) && seen.add(skill.toLowerCase()));
};
