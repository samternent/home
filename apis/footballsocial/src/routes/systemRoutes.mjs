import shell from "shelljs";
export default function systemRoutes(router) {
  router.post(
    "/system/update-server",
    async function (req, res) {
      console.log('updating server')
      try {
        shell.exec('git pull origin main');
        res.sendStatus(200)
      } catch (e) {
        res.sendStatus(500);
      }
    }
  );
}
