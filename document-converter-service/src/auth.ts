import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set!');
  console.error('Please set JWT_SECRET to secure the converter service.');
  process.exit(1);
}

interface JWTPayload {
  service: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to verify JWT token from the main backend
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header. Expected: Bearer <token>' 
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Verify the token is from your backend service
    if (decoded.service !== 'learnkata-backend') {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Invalid service identifier' 
      });
    }

    // Attach decoded payload to request for potential use
    (req as any).jwtPayload = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token has expired' 
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Token verification failed' 
    });
  }
};

/**
 * Generate a JWT token for testing purposes
 * In production, this should only be done by your main backend
 */
export const generateToken = (): string => {
  return jwt.sign(
    { service: 'learnkata-backend' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

