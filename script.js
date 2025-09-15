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
    volume += 1;
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

    if (spinnerName === 'Power-Up Attempt (Solar Panel)') {
      ctx.rotate(-Math.PI / 2); //  offset for 75/25
    }

    if (spinnerName === 'Extreme Cold Weather Event') {
      ctx.rotate(-Math.PI / 2 - (Math.PI * 0.3)); //  offset for 90/10
    }

    if (spinnerName === 'Downlink Attempt (Dipole)') {
      ctx.rotate(-Math.PI / 2 - (Math.PI * .7)); //  offset for 10/90
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
        if (title === 'Extreme Cold Weather Event') {
            resultLabel.textContent = isSuccess ? '✔️ No occurence!' : '❌ Occurred!';
        } else if (title === 'Image Storage (Arduino)') {
            resultLabel.textContent = isSuccess ? '✔️ Success!' : '❌ Image Corrupted!';
        } else {
            resultLabel.textContent = isSuccess ? '✔️ Success!' : '❌ Failure!';
        }
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
    success.power = await spinWheelForOutcome('Power-Up Attempt (Solar Panel)', 0.25);
    review += `<li><strong>Power:</strong> ${success.power ? 'Successful' : 'Failed'}</li>`;
  } else if (power === 'fuelcell') {
    success.power = await spinWheelForOutcome('Power-Up Attempt (Fuel Cell)', 0.5);
    review += `<li><strong>Power:</strong> ${success.power ? 'Successful' : 'Failed'}</li>`;
  } else { // battery is 100% success
    review += `<li><strong>Power:</strong> Successful</li>`;
  }

  // Check for immediate power failure
  if (!success.power) {
    document.getElementById('results').innerHTML = `<h2>Mission Review</h2><ul>${review}</ul><h2>Mission Outcome</h2><p>The power system failed. The CubeSat did not power up, resulting in a <strong>mission failure</strong>.</p>`;
    return;
  }
  
  // Computer spinner
  if (computer === 'arduino') {
    success.computer = await spinWheelForOutcome('Image Storage (Arduino)', 0.5);
    review += `<li><strong>Avionics:</strong> ${success.computer ? 'Image sucessfully saved' : 'Image partially corrupted'}</li>`;
  } else if (computer === 'pi') {
    review += `<li><strong>Avionics:</strong> Image sucessfully saved</li>`;
  }

  // Antenna spinner
  if (antenna === 'dipole') {
    success.antenna = await spinWheelForOutcome('Downlink Attempt (Dipole)', 0.9); // 10% downlink chance
    review += `<li><strong>Antenna:</strong> Downlink ${success.antenna ? 'success' : 'failed'}</li>`;
  } else if (antenna === 'helical') {
    success.antenna = await spinWheelForOutcome('Downlink Attempt (Helical)', 0.5);
    review += `<li><strong>Antenna:</strong> Downlink ${success.antenna ? 'success' : 'failed'}</li>`;
  }

  // Thermal event spinner
  const weatherOccurred = !(await spinWheelForOutcome('Extreme Cold Weather Event', 0.1));
  if (weatherOccurred) {
      if (foil === 'no') {
        success.weather = false;
        review += `<li><strong>Cold Weather Event:</strong> Occurred, and power system failed.</li>`;
      } else {
        review += `<li><strong>Cold Weather Event:</strong> Occurred, but system was protected by insulation foil.</li>`;
      }
  } else {
      review += `<li><strong>Cold Weather Event:</strong> No occurence</li>`;
  }
  
  // --- Final mission result ---
  let output = `<h2>Simulation Review</h2><ul>${review}</ul><h2>Simulation Outcome</h2>`;
  let imageToDisplay = '';
  let outcomeText = '';
  
  // Determine which image to display based on camera and computer choices
  if (computer === 'arduino' && !success.computer) {
      imageToDisplay = (camera === 'highres')
          ? '<img src="Images/High-Res-Glitch.png" alt="Corrupted high-resolution photo from the CubeSat" style="max-width:100%; height:auto; margin-top: 15px;">'
          : '<img src="Images/Low-Res-Glitch.png" alt="Corrupted low-resolution photo from the CubeSat" style="max-width:100%; height:auto; margin-top: 15px;">';
  } else {
      imageToDisplay = (camera === 'highres')
          ? '<img src="Images/High-Res.png" alt="High-resolution photo from the CubeSat" style="max-width:100%; height:auto; margin-top: 15px;">'
          : '<img src="Images/Low-Res.png" alt="Low-resolution photo from the CubeSat" style="max-width:100%; height:auto; margin-top: 15px;">';
  }
  
  // Build the outcome message step-by-step
  let photoStatus = `A <strong>${cameraQuality}</strong> image was taken`;
  let corruptionStatus = '';
  let downlinkStatus = '';
  let recoveryStatus = '';
  
  // Check for computer corruption
  if (computer === 'arduino' && !success.computer) {
    corruptionStatus = ' but corrupted by the Arduino during storage';
  } else {
    corruptionStatus = ' and stored safely';
  }

  // Check for antenna downlink success/failure
  if (success.antenna) {
    downlinkStatus = `. The image was successfully downlinked via the ${antenna} antenna!`;
  } else {
    downlinkStatus = `, however, the image downlink failed.`;
  }
  
  // Check for lander data recovery success/failure
  if (success.weather || foil === 'yes') {
    if (!success.antenna) {
        recoveryStatus = ` The stored image can be recovered <strong>if the system survives the drop test</strong>!`;
    } else {
        recoveryStatus = ` An additional copy of the image may be recovered <strong>if the system survives the drop test</strong>.`;
    }
  } else {
    recoveryStatus = ` No data can be recovered from the drop test as the system failed after downlink due to a weather event.`;
  }

  // Handle the special case where both downlink and drop recovery fail
  if (!success.antenna && !success.weather && foil === 'no') {
      outcomeText = `${photoStatus}${corruptionStatus}${downlinkStatus} An extreme weather event occured and the system failed. <strong>The mission has failed as no data can be recovered!</strong>`;
  } else {
      outcomeText = `${photoStatus}${corruptionStatus}${downlinkStatus}${recoveryStatus}`;
  }


  // Display the final outcome, including the image
  document.getElementById('results').innerHTML = `${output}<p>${outcomeText}</p>${imageToDisplay}`;
});
