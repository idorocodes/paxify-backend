const express = require("express");
const loginStudent = require("../controllers/loginStudent");
const registerStudent = require("../controllers/registerStudent");
const forgotPassword = require("../controllers/forgotPassword");
const router = express.Router();
router.get("/",(req,res)=>res.json({"message":"server working"}));
router.post("/registerstudent",registerStudent);
router.post('/loginstudent',loginStudent);
router.post('/forgotpassword',forgotPassword);

module.exports = router;