const authRouter = require('./routes/auth');

// ...

app.use('/api/admin', authRouter);   // <‑‑ This makes POST /api/admin/login work
