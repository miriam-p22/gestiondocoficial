const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  return res.status(200).json({
    message: "Endpoint de prueba funcionando bien gracias a Express",
    status: "online",
    timestamp: new Date().toISOString(),
    runningOnPort: req.socket.localPort,
  });
});

module.exports = router;
