const http = require("http");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "fitmentai-preview.html");

http
  .createServer((request, response) => {
    if (request.url !== "/" && request.url !== "/fitmentai-preview.html") {
      response.writeHead(302, { Location: "/" });
      response.end();
      return;
    }

    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(filePath).pipe(response);
  })
  .listen(3010, "127.0.0.1");
