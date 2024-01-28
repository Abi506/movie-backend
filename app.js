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
  const {
    username,
    password,
    name,
    gender,
    age,
    location,
    occupation,
    mail,
    mobilenumber,
  } = request.body;
  const isUsernameAvailableQuery = `
  SELECT * FROM updateduser 
  WHERE username='${username}'
  `;
  const isUsernameAvailableArray = await data.get(isUsernameAvailableQuery);
  console.log(isUsernameAvailableArray);

  if (isUsernameAvailableArray === undefined) {
    //username not exist can create new account
    const hashedPassword = await bcrypt.hash(password, 10);
    const createNewAccountQuery = `
    INSERT INTO updateduser(username,password,name,gender,age,location,occupation,mail,mobilenumber)
    VALUES
    (
        '${username}',
        '${hashedPassword}',
        '${name}',
        '${gender}',
        '${age}',
        '${location}',
        '${occupation}',
        '${mail}',
        '${mobilenumber}'
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
  console.log(username, "username");
  const isUserExistsQuery = `
    SELECT * FROM updateduser 
    WHERE username='${username}'
    `;
  const dbUser = await data.get(isUserExistsQuery);
  console.log(dbUser, "dbuserdfndfdnfkjgdfkjndkfgnkdfnjkndf");
  if (dbUser === undefined) {
    //user not exists
    response.status(400);
    response.send({ error_msg: "Invalid User" });
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
app.post("/add-quotes/", authentication, async (request, response) => {
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

//get author quotes api

app.get("/author-quotes/", authentication, async (request, response) => {
  const { author = "" } = request.query;
  console.log(author, "author");
  const getAllQuotesQuery = `
    SELECT * FROM quotes
    WHERE author LIKE '%${author}%'
    `;

  const getAllQuotesArray = await data.all(getAllQuotesQuery);
  console.log(getAllQuotesArray, "author quotes");
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

//all quotes section get all quotes,get particular quote,insert quotes in all quotes
//api to all quotes
app.get("/all-quotes/", authentication, async (request, response) => {
  const { search = "", offset = "" } = request.query;
  const getAllQuotesQuery = `
    SELECT * FROM allquotes
    WHERE author LIKE '%${search}%' OR quote LIKE '%${search}%'
    LIMIT 10
    `;

  const getAllQuotesArray = await data.all(getAllQuotesQuery);
  console.log(getAllQuotesArray, "get all quotes");
  response.send(getAllQuotesArray);
});

//get particular quote api
app.get("/all-quotes/:id", authentication, async (request, response) => {
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
    SELECT * FROM updateduser 
    WHERE username='${username}'
    `;
  const profileDetails = await data.get(profileQuery);
  console.log(profileDetails);
  response.send(profileDetails);
});

//user quotes

//user upload quotes api
app.post("/my-quotes/", authentication, async (request, response) => {
  const { quote, explanation, userid } = request.body;

  const userQuotesUploadQuery = `
  INSERT INTO useruploadedquotes(userid,quote,explanation)
  VALUES(
      '${userid}',
      '${quote}',
      '${explanation}'
  )
  `;
  const userQuotesUploadArray = await data.run(userQuotesUploadQuery);
  console.log(userQuotesUploadArray);
  response.send("Your Quote Uploaded Successfully");
});

//user uploaded quotes get
app.get("/my-quotes/", authentication, async (request, response) => {
  const { username } = request;
  console.log("username", username);
  const userUploadedQuotesQuery = `
    SELECT * FROM useruploadedquotes
    natural join updateduser
    WHERE username='${username}'
    `;

  const userUploadedQuotesArray = await data.all(userUploadedQuotesQuery);
  console.log(userUploadedQuotesArray);
  response.send(userUploadedQuotesArray);
});

//user uploaded quotes delete
app.delete("/my-quotes/", authentication, async (request, response) => {
  const { quoteid } = request.body;
  const deleteQuery = `
    DELETE FROM useruploadedquotes 
    WHERE useruploadedquotes.userid IN (
      SELECT updateduser.userid 
      FROM updateduser 
      WHERE useruploadedquotes.userid = updateduser.userid
    )
    AND useruploadedquotes.quoteid = '${quoteid}';
  `;

  const deleteArray = await data.run(deleteQuery);
});
//update user quotes
app.put("/my-quotes/", authentication, async (request, response) => {
  const { quoteid, quote, explanation } = request.body;
  const updateQuery = `
    UPDATE useruploadedquotes 
    SET quote='${quote}',explanation='${explanation}'
    WHERE quoteid='${quoteid}'
    `;
  const updateArray = await data.run(updateQuery);
  response.send("Quote updated Successfully");
});
