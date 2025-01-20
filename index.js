const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Define a basic route
app.get('/', (req, res) => {
  res.send('Welcome to my Node.js server!');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
