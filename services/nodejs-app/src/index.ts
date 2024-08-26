import * as express from "express";
const app = express();

app.get("/", (request, response) => {
  response.send(`Hi! ECS + ECR + FARGATE!`)
})

const PORT = 80
app.listen(PORT, () => console.log(`The app is listening on port ${PORT}.`));