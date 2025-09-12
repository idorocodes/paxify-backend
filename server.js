const express = require("express");
const app = express();
const router = require("./routes/authRoutes");
const port = 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(router);

app.listen(port, () => console.log(`Server has started, listening on http://localhost:${port}`));
