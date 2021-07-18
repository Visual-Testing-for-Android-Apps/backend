// Import the express dependency
const express = require("express");
const app = express();

// Allow the port to be configured by the server hosting provider from an environment variable
// Otherwise uses a default port of 3000 if the environment variable isn't set
// If you need to run multiple services at the same time on your machine,
// make sure these port numbers are different for each service
const PORT = process.env.PORT || 3000;

// This says to listen for a GET request on the route /aRoute'
app.get("/aRoute", (req, res) => {
  // Do something
  // Sends the string "Result" back to the caller
  res.send("Result");
});

// This says to listen for a POST request on the route /anotherRoute'
app.post("/anotherRoute", (req, res) => {});

// Start the server and listen on the port for incoming http requests
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
