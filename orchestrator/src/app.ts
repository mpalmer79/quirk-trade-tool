/**
 * Main Express Application
 * 
 * Initializes the Quirk Trade Tool orchestrator API
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { validateOnStartup } from './lib/startup-validation';
import valuationRoutes from './routes/valuations';

// ============================================================================
// INITIALIZE EXPRESS APP
// ============================================================================
const app: Express = express();

// ============================================================================
// MIDDLEWARE - SECURITY & PARSING
// ============================================================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================================
// VALIDATION & STARTUP CHECKS
// ============================================================================

// ✅ Validate depreciation calculator on startup
try {
  validateOnStartup();
} catch (error) {
  console.error('❌ Startup validation failed:', error);
  process.exit(1);
}

// ============================================================================
// MIDDLEWARE - REQUEST LOGGING & TRACKING
// ============================================================================

// Add request ID for tracking
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`📨 ${req.method} ${req.path} [${(req as any).id}]`);
  next();
});

// Log response times
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Capture the original res.send
  const originalSend = res.send;
  
  // Override res.send
  res.send = function (data: any) {
    const duration = Date.now() - start;
    console.log(`📤 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    
    // Call the original send
    return originalSend.call(this, data);
  };
  
  next();
});

// ============================================================================
// API ROUTES
// ============================================================================

// Health check - root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'quirk-trade-tool-orchestrator',
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ✅ Valuation routes
app.use('/api/valuations', valuationRoutes);

// Add other existing routes here
// app.use('/api/vehicles', vehicleRoutes);
// app.use('/api/users', userRoutes);
// etc.

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 Not Found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    message: `No route found for ${req.method} ${req.path}`,
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Unhandled error:', error);

  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(status).json({
    error: 'Internal Server Error',
    message,
    requestId: (req as any).id,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// ============================================================================
// EXPORT APP
// ============================================================================
export default app;
