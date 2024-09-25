import express, { NextFunction, Request, Response } from "express";
import createHttpError, { HttpError } from "http-errors";
import { config } from './config/config';
import globalErrorHandler from './middlewares/globalErrorHandler';
import userRouter from './user/userRouter';

const app = express();
app.use(express.json());

//Routes

app.get('/', (req, res)=> {

    const error = createHttpError(400, "something went wrong");
    throw error;

    res.json({ status: 'success', message: 'Welcome to ebook apis' });
});

app.use('/api/users', userRouter);

// Global error handler
app.use(globalErrorHandler);

export default app;