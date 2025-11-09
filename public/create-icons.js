// SafarSquad Icon Generator
// Run with: node public/create-icons.js

const fs = require("fs");
const { createCanvas } = require("canvas");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SafarSquad brand colors
const primaryColor = "#FF6B35"; // Vibrant SafarSquad orange
const textColor = "#FFFFFF"; // White text

sizes.forEach((size) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Create circular badge design
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2;

  // Fill circle with SafarSquad orange
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = primaryColor;
  ctx.fill();

  // Add subtle border
  ctx.strokeStyle = "#F7931E"; // Sunset orange border
  ctx.lineWidth = size * 0.02;
  ctx.stroke();

  // Add "SS" text (SafarSquad)
  ctx.fillStyle = textColor;
  ctx.font = `bold ${size * 0.45}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Add subtle text shadow for depth
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = size * 0.02;
  ctx.shadowOffsetX = size * 0.01;
  ctx.shadowOffsetY = size * 0.01;

  ctx.fillText("SS", centerX, centerY);

  // Save as PNG
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(`public/icon-${size}x${size}.png`, buffer);

  console.log(`✅ Created: icon-${size}x${size}.png`);
});

console.log("\n🎉 All SafarSquad icons created successfully!");
console.log("📁 Location: public/");
console.log("✅ Ready to deploy!");
