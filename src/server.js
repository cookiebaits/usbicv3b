import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRouter from './routes/auth.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Mount at /api to handle /api/login and /api/admin/*
app.use('/api', authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
