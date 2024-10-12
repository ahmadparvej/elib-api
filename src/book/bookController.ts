
import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import cloudinary from './../config/cloudinary';
import path from 'node:path';
import bookModel from './bookModel';
import fs from 'node:fs'
import { AuthRequest } from './../middlewares/authenticate';

const createBook = async (req: Request, res: Response, next: NextFunction) => { 

    const { title, genre, description } = req.body;

    try {

        const book = await bookModel.findOne({ title: title });

        if(book) {
            return next(createHttpError(403, "Book already created with this name"));
        }

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
            description,
            author: _req.userId,
            coverImage: uploadResult.secure_url,
            file: bookFileUploadResult.secure_url
        })

        await fs.promises.unlink(filePath);
        await fs.promises.unlink(bookFilePath);
    
        res.status(201).json({ id: newBook._id, message: "book created" })
    } catch (error) {
        return next(createHttpError(500, "Error while uploading the files."))
    }
}

const updateBook = async (req: Request, res: Response, next: NextFunction) => { 
    const { title, genre, description} = req.body;
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
            description,
            coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
            file: completeFileName ? completeFileName : book.file
        },
        { new: true }
    )

    res.status(200).json({message: "book updated",updateBook: updateBook});
}

const listUsersBooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // todo add pagination

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 3;

        const _req = req as AuthRequest;

        const totalBooks = await bookModel.countDocuments({ author: _req.userId});

        const books = await bookModel.find({ author: _req.userId}).skip((page-1)*limit).limit(limit);

        res.json({
            books,
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit),
            currentPage: page,
          })
    } catch (error) {
        return next(createHttpError(500, "Error while getting books"))
    }
}

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // todo add pagination

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 6;

        const totalBooks = await bookModel.countDocuments({});
        const books = await bookModel.find({}).populate("author", "name").skip((page-1)*limit).limit(limit);

        res.json({
            books,
            totalBooks,
            totalPages: Math.ceil(totalBooks/limit),
            currentPage: page,
          })
    } catch (error) {
        return next(createHttpError(500, "Error while getting books"))
    }
}

const getBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bookId = req.params.bookId;
        const book = await bookModel.findOne({ _id: bookId}).populate("author", "name email");

        if(!book){
            return next(createHttpError(404, "Book Not Found"))
        }

        res.json(book)
    } catch (error) {
        return next(createHttpError(500, "Error while getting book"))
    }
}

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bookId = req.params.bookId;

        // Find the book first to get its file URLs
        const book = await bookModel.findOne({ _id: bookId });

        if (!book) {
            return next(createHttpError(404, "Book Not Found"));
        }

        // Check user access
        const _req = req as AuthRequest;
        if(book.author.toString() !== _req.userId){
            return next(createHttpError(403, "Unauthorized"));
        }

        // Extract public IDs from Cloudinary URLs to delete the files
        const coverImagePublicId = book.coverImage ? book.coverImage.split('/').pop()?.split('.')[0] : null;
        const bookFilePublicId = book.file ? book.file.split('/').pop()?.split('.')[0] : null;
        
        // Delete cover image from Cloudinary, if exists
        if (coverImagePublicId) {
            await cloudinary.uploader.destroy(`book-cover/${coverImagePublicId}`);
        }

        // Delete book file (PDF) from Cloudinary, if exists
        if (bookFilePublicId) {
            await cloudinary.uploader.destroy(`books-pdf/${bookFilePublicId}.pdf`, { resource_type: 'raw' });
        }

        // Delete the book from the database
        await bookModel.findOneAndDelete({ _id: bookId });

        res.status(200).json({ message: "Book and associated files removed successfully" });
    } catch (error) {
        return next(createHttpError(500, "Error while deleting book"));
    }
};

export { createBook, updateBook, listUsersBooks, listBooks, getBook, deleteBook };