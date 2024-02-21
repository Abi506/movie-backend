const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

let data = null;
let dbPath = path.join(__dirname, "movie.db");

const databaseAndServerInitialization = async () => {
  try {
    data = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3001, () => {
      console.log(`Server running at ${dbPath}`);
    });
  } catch (error) {
    console.log(`Database Error ${error.message}`);
  }
};
databaseAndServerInitialization();

//user upload quotes api
app.post("/upload-movies/",  async (request, response) => {
  const { url,movieName,id,cast } = request.body;

  const uploadMoviesQuery = `
  INSERT INTO movie(id,url,movieName,cast)
  VALUES(
      '${id}',
      '${url}',
      '${movieName}',
      '${cast}'
  )
  `;
  const uploadMovies = await data.run(uploadMoviesQuery);
  console.log(uploadMovies);
  response.send("Your movie Uploaded Successfully");
});

//user uploaded quotes get
app.get("/movies/", async (request, response) => {
  const moviesQuery = `
    SELECT * FROM movie
    `;

  const movies = await data.all(moviesQuery);
  console.log(movies);
  response.send(movies);
});
