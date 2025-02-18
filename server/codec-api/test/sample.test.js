const request  = require("supertest")
const User = require('../models/user/user')
const express = require("express");
const app = express();
const router = express.Router();

// TODO: to remove
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log("Logged in as " + username);
  res.status(200).json({ message: 'Login successful' }); // Example response
});

app.use(express.json());
app.use('/api', router);

describe("Login API", () => {
  it("should successfully log in the user", async () => {
    const response = await request(app).post("/api/login").send({
      username: "einjeru",
      password: "password",
    });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Login successful" });
  });
});

