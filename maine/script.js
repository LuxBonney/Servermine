/**
 * BSMP - Bonney SMP
 * Interactive features: Copy IP, Live Player/Status Query, Minecraft Sound FX
 */

const SERVER_IP = "179.197.234.55";
const STATUS_API = `https://api.mcstatus.io/v2/status/java/${SERVER_IP}`;

// Audio Context for Minecraft Click Sound
let audioCtx = null;

function playMinecraftClick() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) {
    // Ignore audio restrictions
  }
}

// Copy to clipboard with visual feedback
function copyIp(text, btnElement) {
  playMinecraftClick();

  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copiado: ${text}`);

    if (btnElement) {
      const textSpan = btnElement.querySelector('.btn-text');
      if (textSpan) {
        const originalText = textSpan.innerText;
        textSpan.innerText = 'Copiado! ✓';
        btnElement.style.filter = 'brightness(1.2)';

        setTimeout(() => {
          textSpan.innerText = originalText;
          btnElement.style.filter = '';
        }, 2000);
      }
    }
  }).catch(() => {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast(`Copiado: ${text}`);
  });
}

// Toast notification helper
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Fetch Live Minecraft Server Status
async function updateServerStatus() {
  const statusText = document.getElementById('status-text');
  const statusIndicator = document.querySelector('.status-indicator');

  if (!statusText) return;

  try {
    const response = await fetch(STATUS_API);
    if (!response.ok) throw new Error('API offline');

    const data = await response.json();

    if (data.online) {
      const playersOnline = data.players?.online ?? 0;
      const playersMax = data.players?.max ?? 60;
      statusText.innerHTML = `Online &bull; <strong>${playersOnline}/${playersMax}</strong> jogadores`;
      if (statusIndicator) {
        statusIndicator.style.backgroundColor = '#55ff55';
        statusIndicator.style.boxShadow = '0 0 8px #55ff55';
      }
    } else {
      statusText.innerHTML = `Offline no momento`;
      if (statusIndicator) {
        statusIndicator.style.backgroundColor = '#ff5555';
        statusIndicator.style.boxShadow = '0 0 8px #ff5555';
      }
    }
  } catch (err) {
    // If external query fails, show default online state gracefully
    statusText.innerHTML = `Online &bull; 179.197.234.55`;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateServerStatus();
  // Poll every 60 seconds
  setInterval(updateServerStatus, 60000);

  // Play click sound on all mc-btn clicks
  document.querySelectorAll('.mc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playMinecraftClick();
    });
  });
});
