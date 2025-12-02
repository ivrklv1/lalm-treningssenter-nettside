// vipps_web.js
// Web-innmelding + Vipps-checkout

function normalizeMobile(mobile) {
  let m = (mobile || '').trim().replace(/\s+/g, '');
  if (/^\d{8}$/.test(m)) m = '+47' + m;
  if (m.startsWith('0047')) m = '+47' + m.slice(4);
  if (!m.startsWith('+') && m.startsWith('47') && m.length === 10) {
    m = '+' + m;
  }
  return m;
}

function setupChooseMembership() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.choose-membership-btn');
    if (!btn) return;

    const membershipId = btn.dataset.membershipId;
    const membershipName = btn.dataset.membershipName;

    // highlight riktig kort
    document.querySelectorAll('.membership-card').forEach((card) => {
      card.classList.remove('active');
    });
    const selectedCard = btn.closest('.membership-card');
    if (selectedCard) selectedCard.classList.add('active');

    // sett tekst og skjult felt i skjema
    const selectedEl = document.getElementById('web-signup-selected');
    const membershipIdInput = document.getElementById('ws-membershipId');
    if (selectedEl) {
      selectedEl.textContent = 'Du har valgt: ' + (membershipName || '');
    }
    if (membershipIdInput) {
      membershipIdInput.value = membershipId || '';
    }

    // vis skjema og scroll ned
    const formSection = document.getElementById('web-signup');
    if (formSection) {
      formSection.style.display = 'block';
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function setupVippsForm() {
  const form = document.getElementById('web-signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('ws-firstName').value.trim();
    const lastName = document.getElementById('ws-lastName').value.trim();
    const email = document.getElementById('ws-email').value.trim();
    const mobile = normalizeMobile(
      document.getElementById('ws-mobile').value
    );
    const membershipId = document.getElementById('ws-membershipId').value;
    const accept = document.getElementById('ws-accept-terms').checked;

    if (!accept) {
      alert('Du må godta vilkår og personvern.');
      return;
    }

    try {
      const res = await fetch(window.SERVER_URL + '/vipps/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'web',
          firstName,
          lastName,
          email,
          mobile,
          membershipId,
        }),
      });

      const data = await res.json();
      const url = data.checkoutUrl || data.redirectUrl;

      if (url) {
        window.location.href = url;
      } else {
        alert('Kunne ikke starte betaling.');
      }
    } catch (err) {
      console.error(err);
      alert('Teknisk feil. Prøv igjen.');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupChooseMembership();
  setupVippsForm();
});
