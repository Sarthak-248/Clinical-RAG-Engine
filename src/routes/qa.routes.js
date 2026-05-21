const express = require("express");
const { askMedicalQuestion } = require("../controllers/qa.controller");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "jubilant Medical QA API" });
});

router.post("/medical/ask", askMedicalQuestion);

module.exports = router;
