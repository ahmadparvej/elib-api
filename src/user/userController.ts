
import { Request } from 'express';
import { Response } from 'express';
import { NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import createHttpError from 'http-errors';
import userModel from './userModel';
import { config } from './../config/config';

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

    //Password validation
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //process
    const newUser = await userModel.create({
        name,
        email,
        password: hashedPassword
    })

    // Token
    const token = sign({ sub: newUser._id }, config.JWT_SECRET as string, { expiresIn: "7d" });

    //response
    res.json({
        message: "user created!",
        accessToken: token
    })
}

export { createUser }