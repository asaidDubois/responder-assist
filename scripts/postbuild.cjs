// Post-build : aplatit commands.html, copie manifest, cree 404.html
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

if (!fs.existsSync(dist)) {
  console.error("dist/ introuvable");
  process.exit(1);
}

// Aplatir commands.html
const srcCommands = path.join(dist, "src", "commands", "commands.html");
if (fs.existsSync(srcCommands)) {
  fs.copyFileSync(srcCommands, path.join(dist, "commands.html"));
  fs.rmSync(path.join(dist, "src"), { recursive: true, force: true });
  console.log("commands.html aplati a la racine");
}

// 404.html
fs.copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"));
console.log("404.html cree");

// Copier le manifeste
const manifestSrc = path.join(root, "public", "manifest.xml");
const manifestDst = path.join(dist, "manifest.xml");
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDst);
  console.log("manifest.xml copie dans dist/");
} else {
  console.warn("public/manifest.xml introuvable - non copie");
}

// Verifications
const required = ["index.html", "commands.html", "404.html", "manifest.xml", "assets"];
for (const f of required) {
  const p = path.join(dist, f);
  if (!fs.existsSync(p)) {
    console.error("MANQUE: " + f);
    process.exit(1);
  }
}

console.log("Post-build OK");
console.log("Contenu de dist/ :");
for (const f of fs.readdirSync(dist)) {
  const stat = fs.statSync(path.join(dist, f));
  console.log("  " + (stat.isDirectory() ? "dir  " : "file ") + f);
}
