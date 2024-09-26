
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { createBook } from './bookController';

const bookRouter = express.Router();

const upload = multer({
    dest: path.resolve(__dirname, '../../public/data/uploads'),
    limits: { fileSize: 3e7 }
})

bookRouter.post('/create', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]), createBook);

export default bookRouter;