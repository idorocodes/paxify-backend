const express = require("express");
const loginStudent = require("../controllers/loginStudent");
const registerStudent = require("../controllers/registerStudent");
const router = express.Router();

router.post("/registerstudent",registerStudent);
router.post('/loginstudent',loginStudent)

module.exports = router;