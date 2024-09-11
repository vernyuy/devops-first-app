import * as express from "express";
const app = express();

app.get("/", (request, response) => {
  response.send(`This is the first service.`)
})


app.get("/home", (request, response) => {
  response.send(`This is the first home pagee service.`)
})

const PORT = 80
app.listen(PORT, () => console.log(`The app is listening on port ${PORT}.`));