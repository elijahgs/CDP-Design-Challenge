document.getElementById('design-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const structure = document.querySelector('input[name="structure"]:checked').value;
  const antenna = document.querySelector('input[name="antenna"]:checked').value;
  const computer = document.querySelector('input[name="computer"]:checked').value;
  const camera = document.querySelector('input[name="camera"]:checked').value;
  const power = document.querySelector('input[name="power"]:checked').value;
  const foil = document.querySelector('input[name="foil"]:checked').value;

  let mass = 0;
  let volume = 0;
  let success = { power: true, computer: true, antenna: true, weather: true };
  let outcome = '';
  let review = '';
  const cameraQuality = (camera === 'highres') ? 'high-resolution' : 'low-resolution';

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
  } else if (power === 'fuelcell') {
    mass += 1;
    volume += 1;
  }

  // Thermal Protection
  if (foil === 'yes') {
    mass += 1;
  }

  // Check mass and volume constraints
  if (mass > 7 || volume > 5) {
    let output = '<h2>Mission Outcome</h2>';
    output += `<p><strong>🚫 Review selections:</strong> The design exceeds the mission's mass and/or volume limits. A launch is not possible with the current configuration.</p>`;
    if (mass > 7) {
      output += `<p>Mass: ${mass} units</p>`;
    }
    if (volume > 5) {
      output += `<p>Volume: ${volume} units</p>`;
    }
    document.getElementById('results').innerHTML = output;
    return;
  }

  // --- Spinner Functions ---
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

    if (spinnerName === 'Extreme Cold Weather Event') {
      ctx.rotate(-Math.PI / 2 - (Math.PI * 0.3)); // extra offset for 90/10
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


  // --- Run Spinners ---
  // Power spinner
  if (power === 'solar') {
    success.power = await spinWheelForOutcome('Power System (Solar Panel)', 0.25);
    review += `<li>Power system: ${success.power ? 'Successful' : 'Failed'}</li>`;
  } else if (power === 'fuelcell') {
    success.power = await spinWheelForOutcome('Power System (Fuel Cell)', 0.5);
    review += `<li>Power system: ${success.power ? 'Successful' : 'Failed'}</li>`;
  } else { // battery is 100% success
    review += `<li>Power system: Successful</li>`;
  }

  // Check for immediate power failure
  if (!success.power) {
    document.getElementById('results').innerHTML = `<h2>Mission Review</h2><ul>${review}</ul><h2>Mission Outcome</h2><p>The power system failed. The CubeSat did not power up, resulting in a **mission failure**.</p>`;
    return;
  }
  
  // Computer spinner
  if (computer === 'arduino') {
    success.computer = await spinWheelForOutcome('Flight Computer (Arduino)', 0.5);
    review += `<li>Computer: ${success.computer ? 'Data is not corrupted' : 'Data is corrupted'}</li>`;
  } else if (computer === 'pi') {
    review += `<li>Computer: Data is not corrupted</li>`;
  }

  // Antenna spinner
  if (antenna === 'dipole') {
    // Dipole is always successful but not a downlink
    review += `<li>Antenna: Basic connection established</li>`;
  } else if (antenna === 'helical') {
    success.antenna = await spinWheelForOutcome('Helical Antenna', 0.5);
    review += `<li>Antenna: Downlink ${success.antenna ? 'success' : 'failed'}</li>`;
  }

  // Thermal event spinner
  const weatherOccurred = !(await spinWheelForOutcome('Extreme Cold Weather Event', 0.1));
  if (weatherOccurred) {
      if (foil === 'no') {
        success.weather = false;
        review += `<li>Weather Event: Occurred, and power system failed.</li>`;
      } else {
        review += `<li>Weather Event: Occurred, but system was protected by insulation foil.</li>`;
      }
  } else {
      review += `<li>Weather Event: Did not occur.</li>`;
  }
  
  // --- Final mission result ---
  let output = `<h2>Mission Review</h2><ul>${review}</ul><h2>Mission Outcome</h2>`;

  // Define outcomes based on the provided logic
  if (!success.weather && antenna === 'dipole') {
    outcome = 'An extreme weather event caused a critical power system failure. The mission has failed.';
  } else if (!success.weather && antenna === 'helical' && !success.antenna) {
    outcome = 'The downlink attempt failed, and then the system suffered a critical power failure due to an extreme weather event. The mission has failed.';
  } else {
    // Templated outcome generation
    let photoStatus = `A **${cameraQuality}** photo was taken`;
    let corruptionStatus = '';
    let recoveryStatus = '';
    
    // Check for corruption
    if (computer === 'arduino' && !success.computer) {
      corruptionStatus = ' but corrupted by the Arduino during storage.';
    }

    // Set recovery status based on antenna type
    if (antenna === 'dipole') {
      recoveryStatus = ' This photo can be recovered if the system survives the drop test.';
      // Combine with a simple mission success phrase
      outcome = `**Mission success!** ${photoStatus}${corruptionStatus}. ${recoveryStatus}`;
    } else { // Helical antenna
      let downlinkStatus = '';
      if (success.antenna) {
        downlinkStatus = ' and successfully downlinked.';
        if (!success.weather && foil === 'no') {
          recoveryStatus = ' No data can be recovered from the drop test as the system failed after downlink due to a weather event.';
        } else {
          recoveryStatus = ' An additional copy of the image may be recovered if the system survives the drop test.';
        }
        outcome = `**Mission success!** ${photoStatus}${corruptionStatus}${downlinkStatus}${recoveryStatus}`;
      } else {
        downlinkStatus = ' but the downlink failed.';
        recoveryStatus = ' A copy of the photo may be recovered if the system survives the drop test.';
        outcome = `**Partial mission success.** ${photoStatus}${corruptionStatus}${downlinkStatus}${recoveryStatus}`;
      }
    }
  }

  // Display the final outcome
  document.getElementById('results').innerHTML = `${output}<p>${outcome}</p>`;
});
