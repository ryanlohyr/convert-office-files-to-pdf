/**
 * File type validation utilities
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a file is a valid DOCX file
 */
export const validateDocxFile = (file: Express.Multer.File): ValidationResult => {
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream' // Some browsers send this for .docx
  ];
  
  const extension = file.originalname.toLowerCase().split('.').pop();
  
  if (extension !== 'docx') {
    return { valid: false, error: 'File must have .docx extension' };
  }
  
  if (!validMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type. Only DOCX files are allowed' };
  }
  
  return { valid: true };
};

/**
 * Validate that a file is a valid PPTX file
 */
export const validatePptxFile = (file: Express.Multer.File): ValidationResult => {
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/octet-stream' // Some browsers send this for .pptx
  ];
  
  const extension = file.originalname.toLowerCase().split('.').pop();
  
  if (extension !== 'pptx') {
    return { valid: false, error: 'File must have .pptx extension' };
  }
  
  if (!validMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type. Only PPTX files are allowed' };
  }
  
  return { valid: true };
};

