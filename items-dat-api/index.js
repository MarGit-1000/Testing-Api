const express = require('express');
const apiRouter = require('./api');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use('/api', apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});