import { config as conf } from 'dotenv'
conf();

const _config = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    FRONTEND_DOMAIN: process.env.FRONTEND_DOMAIN
}

export const config = Object.freeze(_config);