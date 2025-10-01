const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
const { router: authRouter, authenticateToken } = require('./routes/auth');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));


app.use('/auth', authRouter);

app.use('/api', authenticateToken, apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
