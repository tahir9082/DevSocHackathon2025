require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const { MongoClient } = require('mongodb');
const apiRoutes = require('./routes/api');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Skip MongoDB connection for now
// if (process.env.MONGO_URI) {
//   MongoClient.connect(process.env.MONGO_URI)
//     .then(() => console.log("MongoDB connected"))
//     .catch(err => console.error(err));
// } else {
//   console.log("No MongoDB URI provided, skipping DB connection.");
// }

app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
