import libre from 'libreoffice-convert';
import { promisify } from 'util';

const convertAsync = promisify(libre.convert);

export interface ConversionMetrics {
  inputSizeMB: string;
  outputSizeMB: string;
  durationMs: number;
}

/**
 * Convert a DOCX file to PDF using LibreOffice
 */
export const convertDocxToPdf = async (docxBuffer: Buffer): Promise<{ pdf: Buffer; metrics: ConversionMetrics }> => {
  const startTime = Date.now();
  const inputSizeMB = (docxBuffer.length / (1024 * 1024)).toFixed(2);
  
  try {
    const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined);
    const durationMs = Date.now() - startTime;
    const outputSizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2);
    
    return {
      pdf: pdfBuffer,
      metrics: {
        inputSizeMB,
        outputSizeMB,
        durationMs
      }
    };
  } catch (error) {
    throw new Error(`Failed to convert DOCX to PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Convert a PPTX file to PDF using LibreOffice
 */
export const convertPptxToPdf = async (pptxBuffer: Buffer): Promise<{ pdf: Buffer; metrics: ConversionMetrics }> => {
  const startTime = Date.now();
  const inputSizeMB = (pptxBuffer.length / (1024 * 1024)).toFixed(2);
  
  try {
    const pdfBuffer = await convertAsync(pptxBuffer, '.pdf', undefined);
    const durationMs = Date.now() - startTime;
    const outputSizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2);
    
    return {
      pdf: pdfBuffer,
      metrics: {
        inputSizeMB,
        outputSizeMB,
        durationMs
      }
    };
  } catch (error) {
    throw new Error(`Failed to convert PPTX to PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};

