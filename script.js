document.getElementById('design-form').addEventListener('submit', function (e) {
  e.preventDefault();

  // Get user selections
  const structure = document.querySelector('input[name="structure"]:checked').value;
  const computer = document.querySelector('input[name="computer"]:checked').value;
  const camera = document.querySelector('input[name="camera"]:checked').value;
  const power = document.querySelector('input[name="power"]:checked').value;

  let mass = 0;
  let success = { power: true, computer: true, structure: true };

  // Calculate total mass
  mass += (structure === 'interlocking') ? 1 : 2;
  mass += (computer === 'arduino') ? 1 : 2;
  mass += (camera === 'compact') ? 1 : 2;
  mass += (power === 'battery') ? 3 : (power === 'solar') ? 2 : 1;

  // Simulate system failures based on probabilities
  if (power === 'solar' && Math.random() < 0.25) success.power = false;
  if (power === 'fuelcell' && Math.random() < 0.5) success.power = false;
  if (computer === 'arduino' && Math.random() < 0.5) success.computer = false;
  if (structure === 'interlocking' && Math.random() < 0.25) success.structure = false; // Optional drop-test fail

  // Determine outcome
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

