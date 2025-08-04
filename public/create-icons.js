// Create this file: public/create-icons.js
// Run with: node public/create-icons.js

const fs = require("fs");
const { createCanvas } = require("canvas");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const color = "#f97316"; // Orange theme color

sizes.forEach((size) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Fill with theme color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  // Add "WT" text
  ctx.fillStyle = "white";
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WT", size / 2, size / 2);

  // Save as PNG
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(`public/icon-${size}x${size}.png`, buffer);
});

console.log("Icons created successfully!");
