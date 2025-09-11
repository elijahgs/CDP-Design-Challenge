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
    dataDownlink: true,
    weather: true
  };

  // Calculate mass
  mass += (structure === 'interlocking') ? 1 : 2;
  mass += (antenna === 'dipole') ? 1 : 2;
  mass += (computer === 'arduino') ? 1 : 2;
  mass += (camera === 'compact') ? 1 : 2;
  mass += (power === 'battery') ? 3 : (power === 'solar') ? 2 : 1;
  mass += (foil === 'yes') ? 1 : 0;

  // Draws the probability wheel
  function drawWheel(successRatio, spinnerName) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const successAngle = 2 * Math.PI * successRatio;
    
    ctx.save();
    ctx.translate(radius, radius);

    // Apply specific rotation offsets based on the spinner name
    if (spinnerName === 'Power System (Solar Panel)' || spinnerName === 'Power System (Fuel Cell)' || spinnerName === 'Flight Computer (Arduino)' || spinnerName === 'Image Downlink') {
      ctx.rotate(-Math.PI / 2); // 90 degree rotation
    }

    // Green success zone
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + successAngle);
    ctx.closePath();
    ctx.fillStyle = '#4CAF50';
    ctx.fill();

    // Red failure zone
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, -Math.PI / 2 + successAngle, 2 * Math.PI - Math.PI / 2);
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

    let landingAngle;
    if (isSuccess) {
      landingAngle = Math.random() * successRatio;
    } else {
      landingAngle = successRatio + Math.random() * (1 - successRatio);
    }
    
    // Convert to degrees and apply the pointer's starting position
    const totalRotation = (Math.random() * 5 + 5) * 360 + landingAngle * 360;

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
  if (volume > 5) { 
    output += `<p><strong>🚫 CubeSat too large!</strong></p>`;
    document.getElementById('results').innerHTML = output;
    return;
  }

  // Power system spinner (first)
  if (power === 'solar') success.power = await spinWheelForOutcome('Power System (Solar Panel)', 0.25);
  else if (power === 'fuelcell') success.power = await spinWheelForOutcome('Power System (Fuel Cell)', 0.5);
  else success.power = true;

  if (!success.power) {
      output += `<p><strong>⚡ Power system failed.</strong> No photo taken.</p>`;
      document.getElementById('results').innerHTML = output;
      return;
  }

  // Flight computer spinner (second)
  if (computer === 'arduino') success.computer = await spinWheelForOutcome('Flight Computer (Arduino)', 0.5);
  else success.computer = true;

  // Antenna spinner (third)
  if (antenna === 'helical') {
      success.dataDownlink = await spinWheelForOutcome('Image Downlink', 0.5);
  } else {
      success.dataDownlink = true;
  }

  // Extreme weather event spinner (last)
  const weatherOccurs = await spinWheelForOutcome('Extreme Weather Event', 0.1);
  if (weatherOccurs) {
      if (foil === 'no') {
          success.weather = false;
      }
  }
  
  // Final mission result
  if (!success.weather) {
    output += `<p><strong>🥶 Extreme weather event caused mission failure.</strong></p>`;
  } else if (!success.dataDownlink) {
     output += `<p><strong>📡 Data downlink failed.</strong> The image was not recovered.</p>`;
  } else if (!success.computer) {
      let photoStatus = (camera === 'highres') ? 'A high-resolution photo was recovered.' : 'A low-resolution photo was recovered.';
      if (weatherOccurs && foil === 'yes') {
          photoStatus += ' System was protected by insulation foil.';
      }
      output += `<p><strong>✅ Success!</strong> Computer corrupted data, but a glitched photo was recovered. ${photoStatus}</p>`;
  } else {
    let photoStatus = (camera === 'highres') ? 'A high-resolution photo was recovered.' : 'A low-resolution photo was recovered.';
    if (weatherOccurs && foil === 'yes') {
        photoStatus += ' System was protected by insulation foil.';
    }
    output += `<p><strong>✅ Success!</strong> ${photoStatus}</p>`;
  }

  document.getElementById('results').innerHTML = output;
});
