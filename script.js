document.getElementById('design-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const structure = document.querySelector('input[name="structure"]:checked').value;
  const antenna = document.querySelector('input[name="antenna"]:checked').value;
  const computer = document.querySelector('input[name="computer"]:checked').value;
  const camera = document.querySelector('input[name="camera"]:checked').value;
  const power = document.querySelector('input[name="power"]:checked').value;
  const insulation = document.getElementById('insulation').checked;

  let mass = 0;
  let success = { power: true, computer: true, weather: true };

  // Mass budget
  mass += (structure === 'interlocking') ? 1 : 2;
  mass += (antenna === 'dipole') ? 1 : 2;
  mass += (computer === 'arduino') ? 1 : 2;
  mass += (camera === 'compact') ? 1 : 2;
  mass += (power === 'battery') ? 3 : (power === 'solar') ? 2 : 1;
  if (insulation) mass += 1;

  // Draw probability wheel
  function drawWheel(successRatio, spinnerName) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const successAngle = 2 * Math.PI * successRatio;

    ctx.save();
    ctx.translate(radius, radius);

    // Special alignment for solar
    if (spinnerName === 'Power System (Solar Panel)') {
      ctx.rotate(-Math.PI / 2);
    }

    ctx.translate(-radius, -radius);

    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, 0, successAngle);
    ctx.closePath();
    ctx.fillStyle = '#4CAF50';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, successAngle, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#F44336';
    ctx.fill();

    ctx.restore();
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
    drawWheel(successRatio, title);

    const isSuccess = Math.random() > riskChance;
    let landingAngleDeg = isSuccess ? (360 * successRatio) / 2
      : 360 * successRatio + (360 * (1 - successRatio)) / 2;
    const pointerOffset = 90;
    const finalPointerAngle = (landingAngleDeg + pointerOffset) % 360;
    const fullSpins = Math.floor(Math.random() * 4) + 6;
    const totalRotation = fullSpins * 360 + finalPointerAngle;

    canvas.style.transition = 'none';
    canvas.style.transform = `rotate(0deg)`;
    void canvas.offsetWidth;
    canvas.style.transition = 'transform 3.5s ease-out';
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

  // Power spinner
  if (power === 'solar') success.power = await spinWheelForOutcome('Power System (Solar Panel)', 0.25);
  else if (power === 'fuelcell') success.power = await spinWheelForOutcome('Power System (Fuel Cell)', 0.5);
  else success.power = true; // Battery always passes

  // Flight computer spinner
  if (success.power) {
    if (computer === 'arduino') success.computer = await spinWheelForOutcome('Flight Computer (Arduino)', 0.5);
    else success.computer = true; // Pi always passes
  }

  // Extreme weather spinner (10% unless insulated)
  if (!insulation) {
    success.weather = await spinWheelForOutcome('Extreme Weather Event', 0.1);
  }

  // Outcome text
  let output = `<h2>Mission Outcome</h2>`;
  if (mass > 6) {
    output += `<p><strong>🚫 CubeSat too heavy!</strong> (${mass} mass units > 6)</p>`;
  } else if (!success.power) {
    output += `<p><strong>⚡ Power system failed.</strong> No photo taken.</p>`;
  } else if (!success.weather) {
    output += `<p><strong>❄️ Extreme cold destroyed the system.</strong> No photo taken.</p>`;
  } else if (!success.computer) {
    output += `<p><strong>📷 Computer corrupted data.</strong> A glitched photo was recovered.</p>`;
  } else {
    output += (camera === 'highres')
      ? `<p><strong>✅ Success!</strong> A high-resolution photo was recovered.</p>`
      : `<p><strong>✅ Success!</strong> A low-resolution photo was recovered.</p>`;
  }

  document.getElementById('results').innerHTML = output;
});
