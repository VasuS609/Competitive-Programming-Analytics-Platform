const express = require("express");
const app = express();

app.use("/api/platforms", require("./routes/index"));
//app.use("/api/goal", ) -> next feature