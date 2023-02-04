const fs = require("fs");

fs.writeFile("./docs/.nojekyll", " ", () => {});
fs.writeFile("./docs/CNAME", "pepu.krd", () => {});
