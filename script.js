document.getElementById('design-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const structure = document.querySelector('input[name="structure"]:checked').value;
  const computer = document.querySelector('input[name="computer"]:checked').value;
  const camera = document.querySelector('input[name="camera"]:checked').value;
  const power = document.querySelector('input[name="power"]:checked').value;

  let mass = 0;
  let volume = 0;
  let success = { power: true, computer: true };

  // --- Mass and Volume Calculation ---
  // Structures (mass only, no volume impact)
  mass += (structure === 'interlocking') ? 1 : 2;
  // Interlocking & Screw-type explicitly no volume impact

  // Flight computer
  if (computer === 'arduino') {
    mass += 1;
    volume += 2;
  } else { // raspberry
    mass += 2;
    volume += 2;
  }

  // Camera
  if (camera === 'compact') {
    mass += 1;
    volume += 2;
  } else { // highres
    mass += 2;
    volume += 2;
  }

  // Power system
  if (power === 'battery') {
    mass += 3;
    volume += 2;
  } else if (power === 'solar') {
    mass += 2;
    volume += 1;
  } else { // fuelcell
    mass += 1;
    volume += 1;
  }

  // --- Spinner functions unchanged ---
  function drawWheel(successRatio, spinnerName) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const successAngle = 2 * Math.PI * successRatio;

    ctx.save();
    ctx.translate(radius, radius);

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

    let landingAngleDeg;
    if (isSuccess) {
      landingAngleDeg = (360 * successRatio) / 2;
    } else {
      landingAngleDeg = 360 * successRatio + (360 * (1 - successRatio)) / 2;
    }

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

  // Power system spinner
  if (power === 'solar') success.power = await spinWheelForOutcome('Power System (Solar Panel)', 0.25);
  else if (power === 'fuelcell') success.power = await spinWheelForOutcome('Power System (Fuel Cell)', 0.5);
  else success.power = true; // Battery always passes

  // Flight computer spinner
  if (success.power) {
    if (computer === 'arduino') success.computer = await spinWheelForOutcome('Flight Computer (Arduino)', 0.5);
    else success.computer = true; // Raspberry Pi always passes
  }

  // --- Final mission result ---
  let output = `<h2>Mission Outcome</h2>`;
  if (mass > 6) {
    output += `<p><strong>🚫 CubeSat too heavy!</strong> (${mass} mass units > 6)</p>`;
  } else if (volume > 5) {
    output += `<p><strong>🚫 CubeSat too large!</strong> (${volume} volume units > 5)</p>`;
  } else if (!success.power) {
    output += `<p><strong>⚡ Power system failed.</strong> No photo taken.</p>`;
  } else if (!success.computer) {
    output += `<p><strong>📷 Computer corrupted data.</strong> A glitched photo was recovered.</p>`;
  } else {
    output += (camera === 'highres')
      ? `<p><strong>✅ Success!</strong> A high-resolution photo was recovered.</p>`
      : `<p><strong>✅ Success!</strong> A low-resolution photo was recovered.</p>`;
  }

  document.getElementById('results').innerHTML = output;
});
