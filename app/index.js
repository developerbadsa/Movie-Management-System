// Import necessary modules
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const app = express();
const prisma = new PrismaClient();
const cors = require("cors");

app.use(bodyParser.json());
app.use(cors());


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
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied, Try With Admin role" });
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


    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(password, user.password)



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
// View all movies
app.get("/movies", authenticate, async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      include: { ratings: true },
    });
    const moviesWithRatings = movies.map((movie) => {
      const avgRating =
        movie.ratings.reduce((acc, rating) => acc + rating.score, 0) /
        (movie.ratings.length || 1);
      return {
        ...movie,
        avgRating: avgRating.toFixed(1),
        totalRatings: movie.ratings.length,
      };
    });
    res.status(200).json(moviesWithRatings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching movies", error });
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



// Rate a movie
app.post("/movies/:id/rate", authenticate, async (req, res) => {
  const movieId = parseInt(req.params.id);
  const { score } = req.body;

  if (score < 1 || score > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  try {
    const existingRating = await prisma.rating.findFirst({
      where: { movieId, userId: req.user.id },
    });

    if (existingRating) {
      await prisma.rating.update({
        where: { id: existingRating.id },
        data: { score },
      });
      res.status(200).json({ message: "Rating updated" });
    } else {
      await prisma.rating.create({
        data: { score, movieId, userId: req.user.id },
      });
      res.status(201).json({ message: "Rating added" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error rating movie", error });
  }
});





app.post("/movies/:id/report", authenticate, async (req, res) => {
  const movieId = parseInt(req.params.id);
  const {reason} = req.body; 

  try {
    // Ensure the movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reason,
        movie: {
          connect: { id: movieId }, // Link to the existing movie
        },
        user: {
          connect: { id: req.user.id }, // Link to the reporting user
        },
      },
    });

    res.status(201).json({ message: "Movie reported successfully", report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error reporting movie", error });
  }
});






// Admin: View reported movies
app.get("/admin/reports", authenticate, adminOnly, async (req, res) => {

  try {
    const reports = await prisma.report.findMany({
      include: { movie: true },
    });
    res.status(200).json(reports);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error fetching reports", error });
  }
});



// Admin: Approve or reject a report
app.post(
  "/admin/reports/:id/resolve",
  authenticate,
  adminOnly,
  async (req, res) => {
    const reportId = parseInt(req.params.id);
    const { action } = req.body; // "approve" or "reject"

    try {
      if (action === "approve") {
        await prisma.report.update({
          where: { id: reportId },
          data: { status: "APPROVED" },
        });
        res.status(200).json({ message: "Report approved" });
      } else if (action === "reject") {
        await prisma.report.update({
          where: { id: reportId },
          data: { status: "REJECTED" },
        });
        res.status(200).json({ message: "Report rejected" });
      } else {
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error resolving report", error });
    }
  }
);



app.get("/test", async (req, res) => {
  console.log("test");
  res.send("test");
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
