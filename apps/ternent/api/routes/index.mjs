import express from "express";

const router = express.Router();

router.get("/cv", async function (req, res) {
  res.send({
    name: 'Sam Ternent',
    headline: 'Principal Software Engineer @ Teamwork.com',
    email: 'sam.ternent@gmail.com',
    experience: [
      {
        company: 'Teamwork.com',
        from: '',
        to: '',
      },
      {
        company: 'The Beans Group',
        from: '',
        to: '',
      }
    ],
  })
});

export default router;
