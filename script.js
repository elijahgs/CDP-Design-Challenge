document.getElementById('design-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Get user selections
  const structure = document.querySelector('input[name="structure"]:checked').value;
  const computer = document.querySelector('input[name="computer"]:checked').value;
  const camera = document.querySelector('input[name="camera"]:checked').value;
  const power = document.querySelector('input[name="power"]:checked').value;

  let mass = 0;
  let success = { power: true, computer: true, structure: true };

  // Mass calculation
  mass += (structure === 'interlocking') ? 1 : 2;
  mass += (computer === 'arduino') ? 1 : 2;
  mass += (camera === 'compact') ? 1 : 2;
  mass += (power === 'battery') ? 3 : (power === 'solar') ? 2 : 1;

  // Show wheel overlay function
  async function spinWheel(title, riskChance) {
    const overlay = document.getElementById('wheel-overlay');
    const wheel = document.querySelector('.wheel');
    const titleEl = document.getElementById('wheel-title');

    titleEl.textContent = title;
    wheel.style.animation = 'none'; // reset animation
    void wheel.offsetWidth; // force reflow
    wheel.style.animation = 'spin 2s ease-out forwards';

    overlay.style.display = 'flex';

    return new Promise(resolve => {
      setTimeout(() => {
        const outcome = Math.random() > riskChance; // success if > risk
        overlay.style.display = 'none';
        resolve(outcome);
      }, 2500);
    });
  }

  // Simulate each system in sequence
  if (power === 'solar') success.power = await spinWheel('Power System (Solar Panel)', 0.25);
  else if (power === 'fuelcell') success.power = await spinWheel('Power System (Fuel Cell)', 0.5);
  else await spinWheel('Power System (Battery Pack)', 0); // always succeeds

  if (computer === 'arduino') success.computer = await spinWheel('Flight Computer (Arduino)', 0.5);
  else await spinWheel('Flight Computer (Raspberry Pi)', 0); // always succeeds

  if (structure === 'interlocking') success.structure = await spinWheel('Structure (Interlocking)', 0.25);
  else await spinWheel('Structure (Screw-type)', 0); // always succeeds

  // Final outcome
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
