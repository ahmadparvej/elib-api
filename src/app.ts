import express from "express";

const app = express();

//Routes

app.get('/', (req, res)=> {
    res.json({ status: 'success', message: 'Welcome to ebook apis' });
});

export default app;