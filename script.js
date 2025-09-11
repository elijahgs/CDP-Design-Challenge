document.getElementById('design-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const structure = document.querySelector('input[name="structure"]:checked').value;
  const antenna = document.querySelector('input[name="antenna"]:checked').value;
  const computer = document.querySelector('input[name="computer"]:checked').value;
  const camera = document.querySelector('input[name="camera"]:checked').value;
  const power = document.querySelector('input[name="power"]:checked').value;
  const foil = document.querySelector('input[name="foil"]:checked').value; // new

  let mass = 0;
  let volume = 0;
  let success = { power: true, computer: true, antenna: true, weather: true };

  // --- Mass and Volume Calculation ---
  // Structures
  mass += (structure === 'interlocking') ? 1 : 2;

  // Antenna
  mass += (antenna === 'dipole') ? 1 : 2;

  // Flight computer
  if (computer === 'arduino') {
    mass += 1;
    volume += 2;
  } else {
    mass += 2;
    volume += 2;
  }

  // Camera
  if (camera === 'compact') {
    mass += 1;
    volume += 2;
  } else {
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
  } else {
    mass += 1;
    volume += 1;
  }

  // Thermal foil
  if (foil === 'yes') {
    mass += 1; // no volume
  }

  // --- Spinner functions (same as before) ---
  function drawWheel(successRatio, spinnerName) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const successAngle = 2 * Math.PI * successRatio;

    ctx.save();
    ctx.translate(radius, radius);

    if (spinnerName === 'Power System (Solar Panel)' || spinnerName === 'Extreme Cold Weather Event') {
      ctx.rotate(-Math.PI / 2);
    }

    ctx.translate(-radius, -radius);

    // Green arc
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, 0, successAngle);
    ctx.closePath();
    ctx.fillStyle = '#4CAF50';
    ctx.fill();

    // Red arc
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

  // --- Spinners ---
  if (power === 'solar') success.power = await spinWheelForOutcome('Power System (Solar Panel)', 0.25);
  else if (power === 'fuelcell') success.power = await spinWheelForOutcome('Power System (Fuel Cell)', 0.5);
  else success.power = true;

  if (success.power) {
    // Arduino glitch spinner
    if (computer === 'arduino') success.computer = await spinWheelForOutcome('Flight Computer (Arduino)', 0.5);

    // Antenna spinner
    if (antenna === 'helical') success.antenna = await spinWheelForOutcome('Antenna (Helical)', 0.5);
  }

  // Thermal event spinner (always runs if mission has power)
  if (success.power) {
    const weatherOk = await spinWheelForOutcome('Extreme Cold Weather Event', 0.1);
    if (!weatherOk && foil === 'no') {
      success.weather = false; // foil would protect, but not selected
    }
  }

  // --- Final mission result ---
  let output = `<h2>Mission Outcome</h2>`;
  if (mass > 7) {
    output += `<p><strong>🚫 CubeSat too heavy!</strong> (${mass} mass units > 6)</p>`;
  } else if (volume > 5) {
    output += `<p><strong>🚫 CubeSat too large!</strong> (${volume} volume units > 5)</p>`;
  } else if (!success.power) {
    output += `<p><strong>⚡ Power system failed.</strong> No photo taken.</p>`;
  } else if (!success.weather) {
    output += `<p><strong>❄️ Extreme cold event froze the power system.</strong> Mission failed.</p>`;
  } else if (!success.antenna) {
    output += `<p><strong>📡 Antenna downlink failed.</strong> No photo received on Earth.</p>`;
  } else if (!success.computer) {
    output += `<p><strong>📷 Computer corrupted data.</strong> A glitched photo was downlinked.</p>`;
  } else {
    output += (camera === 'highres')
      ? `<p><strong>✅ Success!</strong> A high-resolution photo was downlinked.</p>`
      : `<p><strong>✅ Success!</strong> A low-resolution photo was downlinked.</p>`;
  }

  document.getElementById('results').innerHTML = output;
});
