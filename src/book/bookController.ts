
import { Request } from 'express';
import { Response } from 'express';
import { NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { config } from './../config/config';

const createBook = async (req: Request, res: Response, next: NextFunction) => { 
    res.json({})
}

export { createBook };