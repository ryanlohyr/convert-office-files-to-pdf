import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { convertDocxToPdf, convertPptxToPdf } from './converter';
import { authenticateJWT, generateToken } from './auth';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Health check endpoint (public - no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'document-converter-service' });
});

// Generate test token endpoint (only enable in development!)
if (process.env.NODE_ENV === 'development') {
  app.get('/test/token', (req: Request, res: Response) => {
    const token = generateToken();
    res.json({ 
      token,
      usage: `Authorization: Bearer ${token}`,
      warning: 'This endpoint is only available in development mode'
    });
  });
}

// Convert DOCX to PDF (protected by JWT authentication)
app.post('/convert/docx', authenticateJWT, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`[DOCX Conversion] Starting - Size: ${(req.file.size / (1024 * 1024)).toFixed(2)}MB`);
    
    const { pdf, metrics } = await convertDocxToPdf(req.file.buffer);
    
    console.log(`[DOCX Conversion] Success - Input: ${metrics.inputSizeMB}MB, Output: ${metrics.outputSizeMB}MB, Duration: ${metrics.durationMs}ms`);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    res.setHeader('X-Conversion-Duration', metrics.durationMs.toString());
    res.setHeader('X-Input-Size-MB', metrics.inputSizeMB);
    res.setHeader('X-Output-Size-MB', metrics.outputSizeMB);
    
    res.send(pdf);
  } catch (error) {
    console.error('[DOCX Conversion] Error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Convert PPTX to PDF (protected by JWT authentication)
app.post('/convert/pptx', authenticateJWT, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`[PPTX Conversion] Starting - Size: ${(req.file.size / (1024 * 1024)).toFixed(2)}MB`);
    
    const { pdf, metrics } = await convertPptxToPdf(req.file.buffer);
    
    console.log(`[PPTX Conversion] Success - Input: ${metrics.inputSizeMB}MB, Output: ${metrics.outputSizeMB}MB, Duration: ${metrics.durationMs}ms`);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    res.setHeader('X-Conversion-Duration', metrics.durationMs.toString());
    res.setHeader('X-Input-Size-MB', metrics.inputSizeMB);
    res.setHeader('X-Output-Size-MB', metrics.outputSizeMB);
    
    res.send(pdf);
  } catch (error) {
    console.error('[PPTX Conversion] Error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Document Converter Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

