import * as pdfjsLib from 'pdfjs-dist';

// 必须与 package.json 中的 pdfjs-dist 版本完全一致
const PDFJS_VERSION = '4.0.379';

// 使用 CDN 加载 Worker，避免 Vite 本地构建的复杂配置
// 这里的版本号必须与安装的包版本一致，否则会报错
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  const loadingTask = pdfjsLib.getDocument({ 
    data: arrayBuffer,
    // 使用标准字体映射，解决某些 PDF 乱码问题
    cMapUrl: `https://esm.sh/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
    cMapPacked: true,
  });
  
  try {
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // 将每页的文本块拼接
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }

    return fullText;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from PDF. Please check the Console for details.");
  }
};