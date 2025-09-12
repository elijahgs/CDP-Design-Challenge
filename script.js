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

  // Helper function to simulate a spinner and update the review
  async function spinWheelForOutcome(title, successChance) {
    let result = Math.random() < successChance;
    let outcomeText = result ? 'Success' : 'Failure';
    await spinWheel(title, outcomeText);
    return result;
  }

  // --- Run Spinners ---
  // Power spinner
  if (power === 'solar') {
    success.power = await spinWheelForOutcome('Solar Panel Power System', 0.75);
    review += `<li>Power system: ${success.power ? 'Successful' : 'Failed'}</li>`;
  } else if (power === 'fuelcell') {
    success.power = await spinWheelForOutcome('Fuel Cell Power System', 0.5);
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
    success.computer = await spinWheelForOutcome('Arduino Computer', 0.5);
    review += `<li>Computer: ${success.computer ? 'Data is not corrupted' : 'Data is corrupted'}</li>`;
  } else if (computer === 'pi') {
    review += `<li>Computer: Data is not corrupted</li>`;
  }

  // Antenna spinner
  if (antenna === 'dipole') {
    review += `<li>Antenna: Downlink successful</li>`;
  } else if (antenna === 'helical') {
    success.antenna = await spinWheelForOutcome('Helical Antenna', 0.5);
    review += `<li>Antenna: Downlink ${success.antenna ? 'successful' : 'failed'}</li>`;
  }

  // Thermal event spinner
  const weatherOccurred = !(await spinWheelForOutcome('Extreme Cold Weather Event', 0.9));
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
    let downlinkStatus = '';
    let recoveryStatus = '';
    
    // Check for corruption
    if (computer === 'arduino' && !success.computer) {
      corruptionStatus = ' but corrupted by the Arduino as it was stored.';
    }

    // Check for downlink and recovery
    if (antenna === 'dipole') {
      downlinkStatus = ' and stored for recovery.';
      recoveryStatus = ' This photo can be recovered if the system survives the drop test.';
    } else { // Helical antenna
      if (success.antenna) {
        downlinkStatus = ' and successfully downlinked.';
        if (!success.weather && foil === 'no') {
          recoveryStatus = ' No data can be recovered from the drop test as the system failed after downlink due to a weather event.';
        } else {
          recoveryStatus = ' An additional copy of the image may be recovered if the system survives the drop test.';
        }
      } else {
        downlinkStatus = ' but the downlink failed.';
        recoveryStatus = ' A copy of the photo may be recovered if the system survives the drop test.';
      }
    }
    
    // Construct the final outcome message
    let finalOutcome = photoStatus + corruptionStatus;
    if (antenna === 'helical' && success.antenna) {
      finalOutcome = '**Mission success!** ' + finalOutcome;
    } else if (antenna === 'helical' && !success.antenna) {
      finalOutcome = '**Partial mission success.** ' + finalOutcome;
    } else {
      finalOutcome = '**Mission success!** ' + finalOutcome;
    }

    finalOutcome += downlinkStatus + recoveryStatus;
    outcome = finalOutcome;
  }

  // Display the final outcome
  document.getElementById('results').innerHTML = `${output}<p>${outcome}</p>`;
});

// The spinWheel function is assumed to be defined elsewhere in your code, likely in the same file.
// It is the animation part of the simulation and is not shown here for brevity.
