document.getElementById('design-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const structure = document.querySelector('input[name="structure"]:checked').value;
  const computer = document.querySelector('input[name="computer"]:checked').value;
  const camera = document.querySelector('input[name="camera"]:checked').value;
  const power = document.querySelector('input[name="power"]:checked').value;

  let mass = 0;
  let success = { power: true, computer: true, structure: true };

  mass += (structure === 'interlocking') ? 1 : 2;
  mass += (computer === 'arduino') ? 1 : 2;
  mass += (camera === 'compact') ? 1 : 2;
  mass += (power === 'battery') ? 3 : (power === 'solar') ? 2 : 1;

  // Wheel drawing function with labels
  function drawWheel(successRatio) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const successAngle = 2 * Math.PI * successRatio;

    // Draw success section
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, 0, successAngle);
    ctx.closePath();
    ctx.fillStyle = '#4CAF50'; // Green
    ctx.fill();

    // Draw failure section
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, successAngle, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#F44336'; // Red
    ctx.fill();
  }

    // Labels for every 10th segment
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < segments; i += 10) {
      const angle = ((i + 5) / segments) * 2 * Math.PI;
      const x = radius + (radius * 0.7) * Math.cos(angle);
      const y = radius + (radius * 0.7) * Math.sin(angle);
      const label = i < successSegments ? 'Success' : 'Fail';
      ctx.fillText(label, x, y);
    }
  }

  // Wheel spinning logic
  async function spinPieWheel(title, riskChance) {
    const overlay = document.getElementById('wheel-overlay');
    const titleEl = document.getElementById('wheel-title');
    const canvas = document.getElementById('wheel-canvas');
    const resultLabel = document.getElementById('wheel-result-label');

    resultLabel.textContent = '';
    const successRatio = 1 - riskChance;
    drawWheel(successRatio);

    titleEl.textContent = title;
    overlay.style.display = 'flex';

    const spins = Math.floor(Math.random() * 3) + 3; // 3–5 spins
    const finalAngle = Math.random() * 360;
    const totalRotation = (spins * 360) + finalAngle;

    canvas.style.transform = `rotate(0deg)`;
    void canvas.offsetWidth;
    canvas.style.transform = `rotate(${totalRotation}deg)`;

    return new Promise(resolve => {
      setTimeout(() => {
        const outcome = finalAngle < (360 * successRatio);
        resultLabel.textContent = outcome ? '✔️ Success!' : '❌ Failure';
        resultLabel.style.color = outcome ? '#4CAF50' : '#F44336';
        setTimeout(() => {
          overlay.style.display = 'none';
          resolve(outcome);
        }, 1000);
      }, 3200);
    });
  }

  // Simulate in sequence
  if (power === 'solar') success.power = await spinPieWheel('Power System (Solar Panel)', 0.25);
  else if (power === 'fuelcell') success.power = await spinPieWheel('Power System (Fuel Cell)', 0.5);
  else await spinPieWheel('Power System (Battery Pack)', 0);

  if (computer === 'arduino') success.computer = await spinPieWheel('Flight Computer (Arduino)', 0.5);
  else await spinPieWheel('Flight Computer (Raspberry Pi)', 0);

  if (structure === 'interlocking') success.structure = await spinPieWheel('Structure (Interlocking)', 0.25);
  else await spinPieWheel('Structure (Screw-type)', 0);

  // Final result
  let output = `<h2>Mission Outcome</h2>`;
  if (mass > 6) {
    output += `<p><strong>🚫 CubeSat too heavy!</strong> (${mass} mass units > 6)</p>`;
  } else if (!success.power) {
    output += `<p><strong>⚡ Power system failed.</strong> No photo taken.</p>`;
  } else if (!success.structure) {
    output += `<p><strong>💥 Structure failed drop test.</strong> SD card destroyed. No photo recovered.</p>`;
  } else if (!success.computer) {
    output += `<p><strong>📷 Computer corrupted data.</strong> A glitched photo was recovered.</p>`;
  } else {
    output += (camera === 'highres') ?
      `<p><strong>✅ Success!</strong> A high-resolution photo was recovered.</p>` :
      `<p><strong>✅ Success!</strong> A low-resolution photo was recovered.</p>`;
  }

  document.getElementById('results').innerHTML = output;
});
