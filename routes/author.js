const express = require('express');
const router = express.Router();
const Author = require('../schemas/author'); 

router.post('/authors', async (req, res) => {
    try {
        const author = new Author(req.body);
        await author.save();
        res.status(201).send(author);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/authors', async (req, res) => {
    try {
        const authors = await Author.find();
        res.send(authors);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/authors/:id', async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (!author) {
            return res.status(404).send();
        }
        res.send(author);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/authors/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = [ 'author_name', 'dateofbirth'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const author = await Author.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!author) {
            return res.status(404).send();
        }
        res.send(author);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/authors/:id', async (req, res) => {
    try {
        const author = await Author.findByIdAndDelete(req.params.id);
        if (!author) {
            return res.status(404).send();
        }
        res.send(author);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
