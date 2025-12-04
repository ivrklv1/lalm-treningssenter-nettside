// vipps_web.js
// Web-innmelding + Vipps-checkout

(function () {
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

  async function handleVippsSubmit(e) {
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

    if (!membershipId) {
      alert('Velg et medlemskap før du går videre.');
      return;
    }

    // velg URL: egen server eller samme origin
    const base = window.SERVER_URL || '';
    const endpoint = base ? base + '/vipps/checkout' : '/vipps/checkout';

    const payload = {
  source: 'web',
  channel: 'web',
  platform: 'web',
  firstName,
  lastName,
  email,
  phone: mobile,          // 👈 viktig! serveren forventer "phone"
  mobile,                 // kan stå, men brukes trolig ikke
  membershipId,
  membershipKey: membershipId,
  planId: membershipId
};

    try {
      console.log('Sender Vipps checkout request:', endpoint, payload);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Vipps checkout HTTP-feil:', res.status, text);
        alert('Kunne ikke starte betaling (kode ' + res.status + ').');
        return;
      }

      const data = await res.json();
console.log('Vipps checkout respons:', data);

// prøv flere mulige feltnavn
const url =
  data.checkoutUrl ||
  data.redirectUrl ||
  data.url ||           // 👈 DENNE MÅ VÆRE MED
  data.vippsUrl;

if (url) {
  window.location.href = url;
} else {
  const errMsg =
    data.error ||
    data.message ||
    ('ukjent respons: ' + JSON.stringify(data));
  console.error('Vipps checkout uten URL:', data);
  alert('Kunne ikke starte betaling. (' + errMsg + ')');
}
  }

  function setupVippsForm() {
    const form = document.getElementById('web-signup-form');
    if (!form) return;
    form.addEventListener('submit', handleVippsSubmit);
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupChooseMembership();
    setupVippsForm();
  });
})();
