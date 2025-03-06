const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to draw the JARVIS icon
function drawJarvisIcon(ctx, size, primaryColor = '#0078D7', secondaryColor = '#FFFFFF', pulseColor = '#00A2FF') {
  const center = size / 2;
  
  // Outer circle
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(center, center, center, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner circle
  ctx.fillStyle = secondaryColor;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.78, 0, Math.PI * 2);
  ctx.fill();
  
  // Pulse circle
  ctx.fillStyle = pulseColor;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.58, 0, Math.PI * 2);
  ctx.fill();
  
  // JARVIS interface elements
  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = size * 0.03;
  
  // Concentric circles
  ctx.beginPath();
  ctx.arc(center, center, center * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.28, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.lineWidth = size * 0.015;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.16, 0, Math.PI * 2);
  ctx.stroke();
  
  // Horizontal line
  ctx.lineWidth = size * 0.03;
  ctx.beginPath();
  ctx.moveTo(center - center * 0.4, center);
  ctx.lineTo(center + center * 0.4, center);
  ctx.stroke();
  
  // Vertical line
  ctx.beginPath();
  ctx.moveTo(center, center - center * 0.4);
  ctx.lineTo(center, center + center * 0.4);
  ctx.stroke();
  
  // Diagonal lines
  ctx.lineWidth = size * 0.015;
  ctx.beginPath();
  ctx.moveTo(center - center * 0.28, center - center * 0.28);
  ctx.lineTo(center + center * 0.28, center + center * 0.28);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(center - center * 0.28, center + center * 0.28);
  ctx.lineTo(center + center * 0.28, center - center * 0.28);
  ctx.stroke();
}

// Generate icons in different sizes
const sizes = [192, 512];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  drawJarvisIcon(ctx, size);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buffer);
  
  console.log(`Generated icon-${size}x${size}.png`);
});

console.log('Icon generation complete!'); 