const menu = document.getElementById('menuBtn');
const nav = document.getElementById('mobileNav');
menu?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
});

// Queue anonymous interaction types for the site's consent-managed analytics container.
function recordInteraction(event, details = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, page_path: location.pathname, ...details });
}

document.addEventListener('click', event => {
  const link = event.target.closest?.('a[href]');
  if (!link) return;
  const url = new URL(link.href);
  if (url.hostname === 'www.linkedin.com') {
    const destination = url.pathname.startsWith('/in/') ? 'profil' :
      url.pathname.startsWith('/company/') ? 'entreprise' : 'post';
    recordInteraction('hbb_linkedin_click', { destination });
  } else if (url.origin === location.origin && url.pathname === '/contact') {
    const intent = url.searchParams.get('interet') === 'mission' ? 'mission' : 'contact';
    recordInteraction('hbb_contact_click', { intent });
  }
});

async function configureForms() {
  const forms = document.querySelectorAll('form[data-lead]');
  let available = false;
  try {
    const response = await fetch('/api/lead');
    available = response.ok && (await response.json()).available === true;
  } catch { /* The direct contact link remains available. */ }
  for (const form of forms) {
    const status = form.querySelector('.form-status');
    const submit = form.querySelector('[type="submit"]');
    if (!available) {
      form.querySelector('.form-body').hidden = true;
      form.querySelector('.form-body').style.display = 'none';
      status.textContent = form.id === 'exemple'
        ? 'Pour recevoir un exemple de fiche, indiquez votre métier et votre zone dans votre message.'
        : 'Pour échanger sur un diagnostic ou une mission, indiquez votre entreprise et votre objectif dans votre message.';
      continue;
    }
    submit.disabled = false;
    if (new URLSearchParams(location.search).get('interet') === 'mission') {
      const mission = form.querySelector('[value="mission"]');
      if (mission) mission.checked = true;
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      submit.disabled = true;
      status.textContent = 'Envoi en cours…';
      try {
        const data = Object.fromEntries(new FormData(form));
        data.page = location.pathname;
        data.demande = form.id === 'exemple' ? 'exemple-tender' : data.interet;
        const response = await fetch('/api/lead', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        if (!response.ok || (await response.json()).received !== true) throw new Error();
        recordInteraction('generate_lead', { lead_type: data.demande });
        form.classList.add('sent');
        status.textContent = '';
      } catch {
        status.textContent = 'Envoi non confirmé. Vous pouvez contacter Olivier par LinkedIn.';
        submit.disabled = false;
      }
    });
  }
}
configureForms();
