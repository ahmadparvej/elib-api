
import { raw, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { config } from './../config/config';
import cloudinary from './../config/cloudinary';
import path from 'node:path';
import bookModel from './bookModel';
import fs from 'node:fs'

const createBook = async (req: Request, res: Response, next: NextFunction) => { 

    const { title, genre } = req.body;

    const files = req.files as { [filename: string]: Express.Multer.File[]}
    const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1);
    const fileName = files.coverImage[0].filename;
    const filePath = path.resolve(__dirname, '../../public/data/uploads', fileName)

    try {
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            filename_override: fileName,
            folder: 'book-cover',
            format: coverImageMimeType
        })
    
        const bookFileName = files.file[0].filename;
        const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName);
        const bookFileUploadResult = await cloudinary.uploader.upload( bookFilePath, {
            resource_type: 'raw',
            filename_override: bookFileName,
            folder: 'books-pdf',
            format: "pdf"
        })

        const newBook = await bookModel.create({
            title,
            genre,
            author: '66f38880c7d53ee2272f2f1e',
            coverImage: uploadResult.secure_url,
            file: bookFileUploadResult.secure_url
        })

        console.log(newBook)

        await fs.promises.unlink(filePath);
        await fs.promises.unlink(bookFilePath);
    
        console.log(uploadResult);
        console.log(bookFileUploadResult);
        res.status(201).json({ id: newBook._id })
    } catch (error) {
        return next(createHttpError(500, "Error while uploading the files."))
    }
}

export { createBook };