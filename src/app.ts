import express, { NextFunction, Request, Response } from "express";
import createHttpError, { HttpError } from "http-errors";
import { config } from './config/config';
import globalErrorHandler from './middlewares/globalErrorHandler';

const app = express();

//Routes

app.get('/', (req, res)=> {

    const error = createHttpError(400, "something went wrong");
    throw error;

    res.json({ status: 'success', message: 'Welcome to ebook apis' });
});


// Global error handler
app.use(globalErrorHandler);

export default app;