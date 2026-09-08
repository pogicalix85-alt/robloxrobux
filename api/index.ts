import express from 'express';
import { setupApiRoutes } from '../src/apiServer';

const app = express();
app.use(express.json());

// Register API routes
setupApiRoutes(app);

// Export for Vercel Serverless Function
export default app;
