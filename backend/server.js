const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const taskRoutes = require("./routes/taskRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/tasks", taskRoutes);

app.get("/", (req, res) => {
  res.send("Student Task Manager API is running!");
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Atlas connected successfully!");

    
    app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
}

startServer();
