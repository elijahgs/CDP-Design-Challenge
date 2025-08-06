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

  // Draw a simple two-part pie chart: green (success) and red (fail)
  function drawWheel(successRatio) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const successAngle = 2 * Math.PI * successRatio;

    // Draw success
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, 0, successAngle);
    ctx.closePath();
    ctx.fillStyle = '#4CAF50';
    ctx.fill();

    // Draw failure
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, successAngle, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#F44336';
    ctx.fill();
  }

  // Spin the wheel toward a predetermined outcome
  async function spinWheelForOutcome(title, riskChance) {
    const overlay = document.getElementById('wheel-overlay');
    const titleEl = document.getElementById('wheel-title');
    const canvas = document.getElementById('wheel-canvas');
    const resultLabel = document.getElementById('wheel-result-label');

    resultLabel.textContent = '';
    titleEl.textContent = title;
    overlay.style.display = 'flex';

    // Determine outcome BEFORE spinning
    const isSuccess = Math.random() > riskChance;
    const successRatio = 1 - riskChance;
    drawWheel(successRatio);

    // Calculate target angle
    const pointerOffset = -90; // top of the wheel
    const minAngle = isSuccess ? 0 : 360 * successRatio;
    const maxAngle = isSuccess ? 360 * successRatio : 360;
    const targetAngle = Math.random() * (maxAngle - minAngle) + minAngle;

    // Spin a lot: 6–9 full rotations + final pointer alignment
    const fullRotations = Math.floor(Math.random() * 4) + 6;
    const totalRotation = fullRotations * 360 + targetAngle;

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

  // Simulate each subsystem using pathway 1 logic
  if (power === 'solar') success.power = await spinWheelForOutcome('Power System (Solar Panel)', 0.25);
  else if (power === 'fuelcell') success.power = await spinWheelForOutcome('Power System (Fuel Cell)', 0.5);
  else await spinWheelForOutcome('Power System (Battery Pack)', 0);

  if (computer === 'arduino') success.computer = await spinWheelForOutcome('Flight Computer (Arduino)', 0.5);
  else await spinWheelForOutcome('Flight Computer (Raspberry Pi)', 0);

  if (structure === 'interlocking') success.structure = await spinWheelForOutcome('Structure (Interlocking)', 0.25);
  else await spinWheelForOutcome('Structure (Screw-type)', 0);

  // Final result summary
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
