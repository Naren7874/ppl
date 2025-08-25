import express from "express";
import cors from "cors";
import noteRoutes from "./routes/notes.js";
import aiRoutes from "./routes/ai.js";


const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Allow your frontend origin
  credentials: true, // If you use cookies/auth
}));
// Middleware

app.use(express.json());

// Routes
app.use("/api/notes", noteRoutes);
app.use("/api/ai", aiRoutes);

export default app;
