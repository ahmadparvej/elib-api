
import { raw, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { config } from './../config/config';
import cloudinary from './../config/cloudinary';
import path from 'node:path';
import bookModel from './bookModel';
import fs from 'node:fs'
import { AuthRequest } from './../middlewares/authenticate';

const createBook = async (req: Request, res: Response, next: NextFunction) => { 

    const { title, genre } = req.body;

    try {
        const files = req.files as { [filename: string]: Express.Multer.File[]}
        const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1);
        const fileName = files.coverImage[0].filename;
        const filePath = path.resolve(__dirname, '../../public/data/uploads', fileName);

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

        const _req = req as AuthRequest;

        const newBook = await bookModel.create({
            title,
            genre,
            author: _req.userId,
            coverImage: uploadResult.secure_url,
            file: bookFileUploadResult.secure_url
        })

        await fs.promises.unlink(filePath);
        await fs.promises.unlink(bookFilePath);
    
        res.status(201).json({ id: newBook._id })
    } catch (error) {
        return next(createHttpError(500, "Error while uploading the files."))
    }
}

const updateBook = async (req: Request, res: Response, next: NextFunction) => { 
    const { title, genre } = req.body;
    const bookId = req.params.bookId;

    const book = await bookModel.findOne({ _id: bookId });

    if(!book) {
        return next(createHttpError(403, "Book not found"));
    }

    const _req = req as AuthRequest;
    if(book.author.toString() !== _req.userId){
        return next(createHttpError(403, "Unauthorized"));
    }

    const files = req.files as { [filename: string]: Express.Multer.File[]}

    let completeCoverImage;
    let completeFileName;

    if(files?.coverImage) {
        const fileName = files.coverImage[0].filename;
        const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1);
        const filePath = path.resolve(__dirname, '../../public/data/uploads', fileName);

        const uploadResult = await cloudinary.uploader.upload(filePath, {
            filename_override: fileName,
            folder: 'book-cover',
            format: coverImageMimeType
        })
        completeCoverImage = uploadResult.secure_url;

        await fs.promises.unlink(filePath);
    }

    if(files?.file){
        const bookFileName = files.file[0].filename;
        const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName);
        const bookFileUploadResult = await cloudinary.uploader.upload( bookFilePath, {
            resource_type: 'raw',
            filename_override: bookFileName,
            folder: 'books-pdf',
            format: "pdf"
        });

        completeFileName = bookFileUploadResult.secure_url;
        await fs.promises.unlink(bookFilePath);
    }

    const updateBook = await bookModel.findOneAndUpdate(
        { _id: bookId },
        {
            title: title,
            genre: genre,
            coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
            file: completeFileName ? completeFileName : book.file
        },
        { new: true }
    )

    res.status(200).json(updateBook);
}

export { createBook, updateBook };