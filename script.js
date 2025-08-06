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

  function drawWheel(successRatio) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const successAngle = 2 * Math.PI * successRatio;

    // Success section (green)
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, 0, successAngle);
    ctx.closePath();
    ctx.fillStyle = '#4CAF50';
    ctx.fill();

    // Failure section (red)
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, successAngle, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#F44336';
    ctx.fill();
  }

  async function spinWheelForOutcome(title, riskChance) {
    const overlay = document.getElementById('wheel-overlay');
    const titleEl = document.getElementById('wheel-title');
    const canvas = document.getElementById('wheel-canvas');
    const resultLabel = document.getElementById('wheel-result-label');

    resultLabel.textContent = '';
    titleEl.textContent = title;
    overlay.style.display = 'flex';

    const successRatio = 1 - riskChance;

    // Determine outcome ahead of time
    const isSuccess = Math.random() > riskChance;
    drawWheel(successRatio);

    // Determine target landing angle for pointer at 12 o'clock (−90°)
    let landingAngleDeg;
    if (isSuccess) {
      landingAngleDeg = Math.random() * (360 * successRatio);
    } else {
      landingAngleDeg = 360 * successRatio + Math.random() * (360 * (1 - successRatio));
    }

    // Shift pointer offset: canvas starts at 0° = 3 o'clock, pointer is at 12 o'clock → +90°
    const pointerOffset = 90;
    const adjustedAngle = (landingAngleDeg + pointerOffset) % 360;

    // Full revolutions + adjusted final angle
    const fullSpins = Math.floor(Math.random() * 4) + 6; // always 6–9 spins
    const totalRotation = fullSpins * 360 + adjustedAngle;

    // Apply spin
    canvas.style.transform = `rotate(0deg)`;
    void canvas.offsetWidth;
    canvas.style.transform = `rotate(${totalRotation}deg)`;

    return new Promise(resolve => {
      setTimeout(() => {
        resultLabel.textContent = isSuccess ? '✔️ Success!' : '❌ Failure';
        resultLabel.style.color = isSuccess ? '#4CAF50' : '#F44336';
        setTimeout(() => {
          overlay.style.display = 'none';
          resolve(isSuccess);
        }, 1000);
      }, 3500);
    });
  }

  // Subsystem spinning (with predetermined outcomes)
  if (power === 'solar') success.power = await spinWheelForOutcome('Power System (Solar Panel)', 0.25);
  else if (power === 'fuelcell') success.power = await spinWheelForOutcome('Power System (Fuel Cell)', 0.5);
  else await spinWheelForOutcome('Power System (Battery Pack)', 0);

  if (computer === 'arduino') success.computer = await spinWheelForOutcome('Flight Computer (Arduino)', 0.5);
  else await spinWheelForOutcome('Flight Computer (Raspberry Pi)', 0);

  if (structure === 'interlocking') success.structure = await spinWheelForOutcome('Structure (Interlocking)', 0.25);
  else await spinWheelForOutcome('Structure (Screw-type)', 0);

  // Final report
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

