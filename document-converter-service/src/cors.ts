import cors from 'cors';

/**
 * Configure CORS based on environment variable ALLOWED_ORIGINS
 */
export const configureCors = (): cors.CorsOptions => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) {
        return callback(null, true);
      }

      // If ALLOWED_ORIGINS is set, check against the list
      if (allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      } else {
        // If no ALLOWED_ORIGINS is set, allow all origins (development mode)
        console.warn('⚠️  ALLOWED_ORIGINS not set - allowing all origins (not recommended for production)');
        callback(null, true);
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  };
};

