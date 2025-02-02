import express from "express";

import router from "./routes.js";
import "./db.js";

const app = express();
app.use(express.json());
// Might want to add a middleware here to log all requests
app.use("/", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
