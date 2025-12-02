// ==============================
// Medlemskap fra /api/plans
// ==============================

// Bruk eksisterende SERVER_URL i prosjektet
const PLANS_API_URL = SERVER_URL + '/api/plans';

let allPlans = [];

// Finn hvilken kategori planen tilhører
function membershipCategory(p) {

  // Drop-in (fra admin type = dropin)
  if (p.type === 'dropin') return 'dropin';

  // Korttids (fra admin type = short_term)
  if (p.type === 'short_term') return 'korttids';

  // Standard (binding vs uten binding)
  const binding = Number(p.bindingMonths || 0);
  if (binding > 0) return 'binding';       // 12 mnd binding
  return 'utenbinding';                    // 0 mnd binding
}

// Formater pris fra øre → kr
function formatPrice(amountInOre) {
  const kr = Math.round((amountInOre || 0) / 100);
  return kr.toLocaleString('nb-NO') + ' kr/måned';
}

function clearGrids() {
  const ids = [
    'binding-plans',
    'utenbinding-plans',
    'korttids-plans',
    'dropin-plans',
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
}

// Render medlemskap inn i riktig grid
function renderMemberships() {
  clearGrids();

  allPlans
    .filter(p => p.active !== false && p.showOnWeb !== false)
    .sort((a, b) => {
      const ao = typeof a.sortOrder === 'number' ? a.sortOrder : 9999;
      const bo = typeof b.sortOrder === 'number' ? b.sortOrder : 9999;
      return ao - bo;
    })
    .forEach(p => {
      const cat = membershipCategory(p);
      const grid = document.getElementById(cat + '-plans');
      if (!grid) return;

      const card = document.createElement('div');
      card.className = 'membership-card';

      const bullets = (p.bullets || [])
        .map(b => `<li>${b}</li>`)
        .join('');

      card.innerHTML = `
        <h3>${p.name}</h3>
        ${p.description ? `<p class="membership-desc">${p.description}</p>` : ''}
        <div class="membership-price">
          <strong>${formatPrice(p.amount)}</strong>
        </div>
        ${bullets ? `<ul>${bullets}</ul>` : ''}
      `;

      grid.appendChild(card);
    });
}

// Sett opp faner
function setupMembershipTabs() {
  const buttons = document.querySelectorAll('.tab-button[data-tab]');
  const panels = document.querySelectorAll('.tab-panel');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;

      // marker aktiv knapp
      buttons.forEach(b => b.classList.remove('active'));
      button.classList.add('active');

      // vis riktig panel
      panels.forEach(p => {
        if (p.id === 'tab-' + tab) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
    });
  });
}

// Hent medlemskap fra backend
async function loadMemberships() {
  try {
    const res = await fetch(PLANS_API_URL);
    const data = await res.json();
    allPlans = Array.isArray(data) ? data : [];
    renderMemberships();
  } catch (err) {
    console.error('Feil ved lasting av medlemskap:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupMembershipTabs();
  loadMemberships();
});

