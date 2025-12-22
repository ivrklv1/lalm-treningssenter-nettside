// lalm_nettside.js
// Felles front-end logikk (UI, faner, medlemskap)

// Gjør SERVER_URL global så andre skript (vipps_web.js) kan bruke den
window.SERVER_URL = window.SERVER_URL || 'https://lalm-treningssenter-server.onrender.com';

// -----------------------------
// Mobilmeny (hamburger)
// -----------------------------
window.toggleMenu = function toggleMenu() {
  const menu = document.getElementById('mobileNav');
  if (menu) {
    menu.classList.toggle('open');
  }
};

// -----------------------------
// Marker aktiv side i toppmeny
// -----------------------------
function highlightActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.topnav-links a');

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
}

// -----------------------------
// Faner for medlemskap
// -----------------------------
function setupMembershipTabs() {
  const tabButtons = document.querySelectorAll('.tab-button[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');

      // aktiv knapp
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // vis riktig panel (id="tab-<data-tab>")
      tabPanels.forEach((panel) => {
        if (panel.id === 'tab-' + tab) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });
}

// -----------------------------
// Medlemskap fra /api/plans
// -----------------------------

const PLANS_API_URL = window.SERVER_URL + '/api/plans';

let allPlans = [];

function formatKr(øre) {
  if (typeof øre !== 'number') return '';
  return (øre / 100)
    .toLocaleString('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
    })
    .replace(',00', '');
}

function categorizePlans(plans) {
  const visible = plans.filter(
    (p) => p && p.showOnWeb !== false && p.active !== false
  );

  return {
    binding: visible.filter(
      (p) => p.type === 'standard' && (p.bindingMonths || 0) > 0
    ),
    utenbinding: visible.filter(
      (p) => p.type === 'standard' && (p.bindingMonths || 0) === 0
    ),
    korttids: visible.filter((p) => p.type === 'short_term'),
    dropin: visible.filter((p) => p.type === 'dropin'),
  };
}

function renderGroup(list, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  if (!list.length) {
    container.innerHTML =
      '<p class="empty-text">Ingen medlemskap i denne kategorien.</p>';
    return;
  }

  list
    .slice()
    .sort((a, b) => {
      const ao = typeof a.sortOrder === 'number' ? a.sortOrder : 9999;
      const bo = typeof b.sortOrder === 'number' ? b.sortOrder : 9999;
      return ao - bo;
    })
    .forEach((p) => {
      const card = document.createElement('article');
      card.className = 'membership-card';

      const isDropin = p.type === 'dropin';
      const isShortTerm = p.type === 'short_term';

      let priceText = '';

      if (isDropin) {
        priceText = `${formatKr(p.amount)} <span>per gang</span>`;
      } else if (isShortTerm && p.shortTermDays) {
        priceText = `${formatKr(p.amount)} <span>/ ${p.shortTermDays} dager</span>`;
      } else {
        priceText = `${formatKr(p.amount)} <span>/måned</span>`;
      }


      const signupFeeHtml = p.signupFee
        ? `<div class="membership-meta">Innmeldingsavgift: ${formatKr(
            p.signupFee
          )}</div>`
        : '';

      const metaText =
        p.description ||
        (p.bindingMonths
          ? `${p.bindingMonths} måneders bindingstid.`
          : 'Ingen bindingstid.');

      const bulletsHtml = (p.bullets || [])
        .map((b) => `<li>${b}</li>`)
        .join('');

      card.innerHTML = `
        <h3>${p.name}</h3>
        <div class="membership-tagline">
          ${p.tagline || ''}
        </div>
        <div class="membership-price">
          ${priceText}
        </div>
        ${signupFeeHtml}
        <div class="membership-meta">
          ${metaText}
        </div>

        ${
          isDropin
            ? `<div class="membership-button">
                 Drop-in kjøpes i appen
               </div>`
            : `<button
                 class="membership-button choose-membership-btn"
                 data-membership-id="${p.id}"
                 data-membership-name="${p.name}"
               >
                 Velg medlemskap
               </button>`
        }

        <div class="membership-benefits">
          <ul>${bulletsHtml}</ul>
        </div>
      `;

      container.appendChild(card);
    });
}

async function loadPlansForWeb() {
  try {
    const res = await fetch(PLANS_API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const plans = await res.json();
    allPlans = Array.isArray(plans) ? plans : [];
    const groups = categorizePlans(allPlans);

    renderGroup(groups.binding, 'binding-plans');
    renderGroup(groups.utenbinding, 'utenbinding-plans');
    renderGroup(groups.korttids, 'korttids-plans');
    renderGroup(groups.dropin, 'dropin-plans');
  } catch (err) {
    console.error('Feil ved henting av planer til nettsiden:', err);
  }
}

// -----------------------------
// Init
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  setupMembershipTabs();
  loadPlansForWeb();
});
