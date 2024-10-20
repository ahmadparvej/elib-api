import express from "express";
import globalErrorHandler from './middlewares/globalErrorHandler';
import userRouter from './user/userRouter';
import bookRouter from './book/bookRouter';
import cors from 'cors'
import { config } from './config/config';

const app = express();
app.use(cors({
    origin: config.FRONTEND_DOMAIN
}));
app.use(express.json());

//Routes

app.get('/', (req, res)=> {
    res.json({ status: 'success', message: 'Welcome to ebook apis' });
});

app.use('/api/users', userRouter);
app.use('/api/books', bookRouter)

// Global error handler
app.use(globalErrorHandler);

export default app;