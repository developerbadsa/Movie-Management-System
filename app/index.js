// Import necessary modules
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const app = express();
const prisma = new PrismaClient();

app.use(bodyParser.json());

// Middleware for authentication
const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Middleware for admin access
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

// User registration
app.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(
    prisma.user.create({
      data: { username, email, password: hashedPassword, role },
    })
  );

  try {
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword, role },
    });
    res.status(201).json({ message: "User created", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating user", error });
  }
});

// User login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;


  try {
    const user = await prisma.user.findUnique({ where: { email } });

    console.log(user)

    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});


// Show all movies
app.get("/movies", authenticate, async (req, res) => {

 
  try {
    const movie = await prisma.movie.findMany()
  
    res.status(201).json({ message: "All Movies", movie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error showing movie", error });
  }
  


});

// Create a movie
app.post("/movies", authenticate, async (req, res) => {
  const { title, description, releasedAt, duration, genre, language } =
    req.body;

  console.log(req.user.id);

 
  try {
    const movie = await prisma.movie.create({
      data: {
        title: title,
        description:description,
        releasedAt: new Date(releasedAt), // Convert string to Date object
        duration:duration,
        genre: genre,
        language: language,
        creator: {
          connect: { id: req.user.id }, // Associate with the logged-in user
        },
      },
    });
  
    res.status(201).json({ message: "Movie created", movie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating movie", error });
  }
  


});

// Update a movie
app.put("/movies/:id", authenticate, async (req, res) => {
  const movieId = parseInt(req.params.id); // Get movie ID from URL
  const { title, description, releasedAt, duration, genre, language } = req.body;

  try {
    // Check if the movie exists and if the user is the creator
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    if (movie.creatorId !== req.user.id) {
      return res.status(403).json({ message: "You are not allowed to update this movie" });
    }

    // Update the movie
    const updatedMovie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        title: title || movie.title, // Only update if provided
        description: description || movie.description,
        releasedAt: releasedAt ? new Date(releasedAt) : movie.releasedAt,
        duration: duration || movie.duration,
        genre: genre || movie.genre,
        language: language || movie.language,
      },
    });

    res.status(200).json({ message: "Movie updated successfully", movie: updatedMovie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating movie", error });
  }
});





app.get("/test", async (req, res) => {
  console.log("test");
  res.send("test");
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
