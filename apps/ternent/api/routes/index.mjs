import express from "express";
import { join, dirname } from 'path';
import { fileURLToPath } from "url";

const router = express.Router();

router.get("/cv", async function (req, res) {
  res.send({
    name: 'Sam Ternent',
    headline: 'Principal Software Engineer @ Teamwork.com',
    email: 'sam.ternent@gmail.com',
    experience: [
      {
        company: 'Teamwork.com',
        from: '2016-08-06',
        to: 'Now',
        projects: [
          {
            name: 'Legacy migration',
            headline: '',
            description: 'Migrated our legacy web application from gulp & requireJS with a manual deployment, to webpack and CI deplyments through TravisCI',
            completed: '2018',
            technologies: ['webpack', 'knockout', 'requireJS', 'coffeescript', 'vue', 'travis']
          },
          {
            name: 'Vue migration',
            headline: '',
            description: '',
          }
        ],
      },
      {
        company: 'The Beans Group',
        from: '',
        to: '',
      }
    ],
  })
});

router.get("*", function (req, res) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  res.sendFile(join(__dirname, "../views/index.html"));
});


export default router;
