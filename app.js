const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

let data = null;
let dbPath = path.join(__dirname, "quotes.db");

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

//register user api
app.post("/register/", async (request, response) => {
  const { username, password, name, gender, age, location } = request.body;
  const isUsernameAvailableQuery = `
  SELECT * FROM user 
  WHERE username='${username}'
  `;
  const isUsernameAvailableArray = await data.get(isUsernameAvailableQuery);
  console.log(isUsernameAvailableArray);

  if (isUsernameAvailableArray === undefined) {
    //username not exist can create new account
    const hashedPassword = await bcrypt.hash(password, 10);
    const createNewAccountQuery = `
    INSERT INTO user(username,password,name,gender,age,location)
    VALUES
    (
        '${username}',
        '${hashedPassword}',
        '${name}',
        '${gender}',
        '${age}',
        '${location}'
    )
    `;
    const createNewAccountArray = await data.run(createNewAccountQuery);
    response.send("Account Created Successfully");
  } else {
    //username already exist
    response.status(400);
    response.send("Username Already Exist");
  }
});

//login api
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const isUserExistsQuery = `
    SELECT * FROM user 
    WHERE username='${username}'
    `;
  const dbUser = await data.get(isUserExistsQuery);
  if (dbUser === undefined) {
    //user not exists
    response.status(400);
    response.send("Invalid User");
  } else {
    //user exists
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    console.log(password, "here", dbUser.password, "userExists");
    console.log(isPasswordMatched, "passwordMatched");
    if (isPasswordMatched === true) {
      //password is correct
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "my_token");
      response.send({ jwtToken });
    } else {
      //invalid password
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

const authentication = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  console.log(authHeader, "");
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
    jwt.verify(jwtToken, "my_token", async (error, payload) => {
      console.log(payload, "payload");
      if (error) {
        response.status(401);
        response.send("Invalid JWT token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  } else {
    response.status(401);
    response.send("Invalid jwt Token");
  }
};

//add quotes api
app.post("/add-quotes/", async (request, response) => {
  const { quote, explanation, author } = request.body;
  const addQuotesQuery = `
    INSERT INTO quotes(author,quote,explanation)
    values(
        '${author}',
        '${quote}',
        '${explanation}'
    )
    `;
  const addQuotesArray = await data.run(addQuotesQuery);
  console.log(addQuotesArray, "addQuotesArray");
  response.send("Quotes Added Successfully");
});

//get all quotes api

app.get("/author-quotes/", async (request, response) => {
  const { author = "" } = request.query;
  console.log(author, "author");
  const getAllQuotesQuery = `
    SELECT * FROM quotes
    WHERE author LIKE '%${author}%'
    `;

  const getAllQuotesArray = await data.all(getAllQuotesQuery);
  response.send(getAllQuotesArray);
});

//api to get top quotes
app.get("/top-quotes/", authentication, async (request, response) => {
  const getAllQuotesQuery = `
    SELECT * FROM topquotes`;

  const getAllQuotesArray = await data.all(getAllQuotesQuery);
  response.send(getAllQuotesArray);
});

//inserting top quotes api
app.post("/top-quotes/", async (request, response) => {
  const { quote, explanation, author } = request.body;
  const addQuotesQuery = `
    INSERT INTO topquotes(author,quote,explanation)
    values(
        '${author}',
        '${quote}',
        '${explanation}'
    )
    `;
  const addQuotesArray = await data.run(addQuotesQuery);
  console.log(addQuotesArray, "addQuotesArray");
  response.send("Quotes Added Successfully");
});

//top quotes delete
app.delete("/top-quotes/:id", async (request, response) => {
  const { id } = request.params;
  const deleteQuery = `
    DELETE FROM topquotes
    where id='${id}'
    `;
  const deleteArray = await data.run(deleteQuery);
  response.send("Quote Deleted");
});

//all quotes section get all quotes,get particular quote,insert quotes in all quotes
//api to all quotes
app.get("/all-quotes/", async (request, response) => {
  const { search_q = "", order_by = "", order = "" } = request.query;
  console.log(search_q, "author");
  const getAllQuotesQuery = `
    SELECT * FROM allquotes
    WHERE author LIKE '%${search_q}%' or quote like '%${search_q}%'
    order by ${order_by} ${order}
    `;

  const getAllQuotesArray = await data.all(getAllQuotesQuery);
  response.send(getAllQuotesArray);
  console.log(getAllQuotesArray);
});

//get particular quote api
app.get("/all-quotes/:id", async (request, response) => {
  const { id = "" } = request.params;
  const getQuoteQuery = `
  SELECT * FROM allquotes 
  where id='${id}'
  `;
  const getQuoteArray = await data.get(getQuoteQuery);
  response.send(getQuoteArray);
});

//inserting all quotes api
app.post("/upload-quotes/", async (request, response) => {
  const { quote, explanation, author } = request.body;
  const addQuotesQuery = `
    INSERT INTO allquotes(author,quote,explanation)
    values(
        '${author}',
        '${quote}',
        '${explanation}'
    )
    `;
  const addQuotesArray = await data.run(addQuotesQuery);
  console.log(addQuotesArray, "addQuotesArray");
  response.send("Quotes Added Successfully");
});

//get user details api
app.get("/profile/", authentication, async (request, response) => {
  const { username } = request;
  const profileQuery = `
    SELECT * FROM user 
    WHERE username='${username}'
    `;
  const profileDetails = await data.get(profileQuery);
  console.log(profileDetails);
});
