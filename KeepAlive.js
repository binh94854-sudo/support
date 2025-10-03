const express = require("express");

function keepAlive() {
  const app = express();

  app.get("/", (req, res) => {
    res.send("Bot is alive!");
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🌐 KeepAlive server running on port ${PORT}`);
  });
}

module.exports = keepAlive;
