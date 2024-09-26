
import { Request } from 'express';
import { Response } from 'express';
import { NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import createHttpError from 'http-errors';
import userModel from './userModel';
import { config } from './../config/config';
import { User } from './userTypes';

const createUser = async (req: Request, res: Response, next: NextFunction) => {
    
    const { name, email, password } = req.body;

    //validation
    if(!name || !email || !password) {
        const error = createHttpError(400, "All fields are required")
        return next(error)
    }

    //Database call
    try {
        const user = await userModel.findOne({ email });
        if(user) {
            const error = createHttpError(400, "User already exist")
            return next(error)
        }
    } catch (error) {
        return next(createHttpError(500, "Error while user validation"));
    }

    //Password validation
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let newUser: User;

    try {
        newUser = await userModel.create({
            name,
            email,
            password: hashedPassword
        })
    } catch(error) {
        return next(createHttpError(500, "Error while user creation"));
    }

    try {
        const token = sign({ sub: newUser._id }, config.JWT_SECRET as string, { expiresIn: "7d" });

        res.status(201).json({
            message: "user created!",
            accessToken: token
        })
    } catch(error) {
        return next(createHttpError(500, "Error while getting user"));
    }
}

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    //validation
    if(!email || !password) {
        const error = createHttpError(400, "All fields are required")
        return next(error)
    }

    //Database call
    try {
        const user = await userModel.findOne({ email });

        if(!user) {
            return next(createHttpError(404, "User not found"));
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return next(createHttpError(400, "Username or password incorrect"));
        }

        const token = sign({ sub: user._id }, config.JWT_SECRET as string, { expiresIn: "7d" });

        res.status(201).json({
            accessToken: token
        })
    } catch (error) {
        return next(createHttpError(500, "User not found"));
    }

}

export { createUser, loginUser }