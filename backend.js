const env = process.env.NODE_ENV;

const meow = require("meow");

let args = meow("", {
  flags: {
    port: {
      type: "string",
      default: "4000"
    }
  }
});

const conf = {
  port: parseInt(args.flags.port)
};

const express = require("express");
const app = express();

const bodyParser = require("body-parser");

const http = require("http").createServer(app);

if (env != "production") {
  const webpack = require("webpack");
  const wpConf = require("./webpack.config");
  const webpackDevMiddleware = require("webpack-dev-middleware");
  const wpCompiler = webpack(wpConf);
  app.use(
    webpackDevMiddleware(wpCompiler, {
      publicPath: wpConf.output.publicPath
    })
  );
}

app.post("/update", bodyParser.text(), (req, res) => {
  require("fs").writeFileSync("outputtest/output.js", req.body);
  res.sendStatus(200);
});

app.post("/getfile", require("multer")().any(), (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send(req.files[0].buffer.toString());
});

app.use(express.static("./dist"));

http.listen(conf.port, () => {
  console.log("Listening on port %s", conf.port);
});
