const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 3001;
const SERVICE_PORT = process.env.SERVICE_ADDRESS || 3000;

// This says to listen for a GET request on the route /aRoute'
app.get("/aRoute", (req, res) => {
  // This will perform a GET request to service1
  axios
    .get(SERVICE_PORT)
    .then((resp) => {
      console.log(resp.data); // Will print 'Result'
    })
    .catch((error) => {
      console.log(error);
    });
  res.end();
});

// Start the server and listen on the port for incoming http requests
app.listen(PORT, () => {
  console.log("Listening on port: ${PORT}");
});
