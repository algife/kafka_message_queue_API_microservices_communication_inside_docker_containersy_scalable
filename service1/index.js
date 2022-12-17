const express = require("express");
const app = express();
const port = process.env.PORT;

// -------
app.use(express.json());
// -------
app.post("/", (req, res) => {
  res.status(200).json("POST Endpoint works");
});

// -------
app.listen(port, () => {
  console.log("Server 1 it's UP and running");
});
