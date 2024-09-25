
import { Request } from 'express';
import { Response } from 'express';
import { NextFunction } from 'express';
import createHttpError from 'http-errors';
import userModel from './userModel';

const createUser = async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
    
    const { name, email, password } = req.body;
    //validation
    if(!name || !email || !password) {
        const error = createHttpError(400, "All fields are required")
        return next(error)
    }

    //Database call
    const user = await userModel.findOne({ email });
    if(user) {
        const error = createHttpError(400, "User already exist")
        return next(error)
    }
    //process

    //response
    res.json({
        message: "user created!"
    })
}

export { createUser }