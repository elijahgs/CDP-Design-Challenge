document.getElementById('design-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const structure = document.querySelector('input[name="structure"]:checked').value;
  const antenna = document.querySelector('input[name="antenna"]:checked').value;
  const computer = document.querySelector('input[name="computer"]:checked').value;
  const camera = document.querySelector('input[name="camera"]:checked').value;
  const power = document.querySelector('input[name="power"]:checked').value;
  const foil = document.querySelector('input[name="foil"]:checked').value;

  let mass = 0;
  let success = {
    power: true,
    computer: true,
    dataDownlink: false,
    weather: true
  };

  // Calculate mass
  mass += (structure === 'interlocking') ? 1 : 2;
  mass += (antenna === 'dipole') ? 1 : 2;
  mass += (computer === 'arduino') ? 1 : 2;
  mass += (camera === 'compact') ? 1 : 2;
  mass += (power === 'battery') ? 3 : (power === 'solar') ? 2 : 1;
  mass += (foil === 'yes') ? 1 : 0;

  // Draws the probability wheel with optional canvas rotation
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
    } else if (spinnerName === 'Extreme Weather Event') {
       ctx.rotate(-Math.PI / 2);
    }

    ctx.translate(-radius, -radius);

    // Green success zone
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, 0, successAngle);
    ctx.closePath();
    ctx.fillStyle = '#4CAF50';
    ctx.fill();

    // Red failure zone
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, successAngle, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#F44336';
    ctx.fill();

    ctx.restore();
  }

  // Spinning animation and outcome resolution
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

  // Check mass and volume limits
  let output = `<h2>Mission Outcome</h2>`;
  if (mass > 7) {
    output += `<p><strong>🚫 CubeSat too heavy!</strong> (${mass} mass units > 7)</p>`;
    document.getElementById('results').innerHTML = output;
    return;
  }
  // Volume limit remains at 5 units.
  const volume = (structure === 'interlocking') ? 1 : 2;
  if (volume > 5) { // Assuming other components don't add to volume. This check might be more complex if they did.
    output += `<p><strong>🚫 CubeSat too large!</strong></p>`;
    document.getElementById('results').innerHTML = output;
    return;
  }

  // Extreme weather event spinner (always spins)
  const isExtremeWeather = await spinWheelForOutcome('Extreme Weather Event', 0.1);
  if (isExtremeWeather && foil === 'no') {
      success.weather = false;
  }
  
  // Power system spinner
  if (success.weather) {
      if (power === 'solar') success.power = await spinWheelForOutcome('Power System (Solar Panel)', 0.25);
      else if (power === 'fuelcell') success.power = await spinWheelForOutcome('Power System (Fuel Cell)', 0.5);
      else success.power = true;
  }
  
  // Flight computer spinner (only if power and weather passed)
  if (success.weather && success.power) {
      if (computer === 'arduino') success.computer = await spinWheelForOutcome('Flight Computer (Arduino)', 0.5);
      else success.computer = true;
  }

  // Data downlink chance for Helical Antenna
  if (antenna === 'helical') {
      success.dataDownlink = Math.random() < 0.5;
  } else {
      // Dipole always succeeds in basic communications
      success.dataDownlink = true; 
  }

  // Final mission result
  if (!success.weather) {
    output += `<p><strong>🥶 Extreme weather event caused mission failure.</strong></p>`;
  } else if (!success.power) {
    output += `<p><strong>⚡ Power system failed.</strong> No photo taken.</p>`;
  } else if (!success.computer) {
    output += `<p><strong>📷 Computer corrupted data.</strong> A glitched photo was recovered.</p>`;
  } else if (camera === 'highres' && !success.dataDownlink) {
     output += `<p><strong>📡 Data downlink failed.</strong> The high-resolution photo was not recovered.</p>`;
  } else {
    let photoStatus = (camera === 'highres') ? 'A high-resolution photo was recovered.' : 'A low-resolution photo was recovered.';
    if (camera === 'highres' && antenna === 'helical' && success.dataDownlink) {
        photoStatus += ' The Helical Antenna successfully downlinked the photo.';
    }
    output += `<p><strong>✅ Success!</strong> ${photoStatus}</p>`;
  }

  document.getElementById('results').innerHTML = output;
});
