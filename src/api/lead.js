const interests = new Set(['local', 'tender', 'both', 'mission']);

module.exports = async function lead(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const destination = process.env.HBB_SITE_LEAD_WEBHOOK_URL;
  if (req.method === 'GET') return res.json({ available: Boolean(destination) });
  if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'GET, POST').end();
  if (!destination) return res.status(503).json({ received: false });
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).end(); }
  }
  if (!body || typeof body !== 'object') return res.status(400).end();
  if (body.website) return res.status(400).end();
  const fields = ['entreprise', 'nom', 'telephone', 'email', 'interet', 'metier', 'zone', 'contact', 'page'];
  const data = {};
  for (const field of fields) {
    const value = body[field] ?? '';
    if (typeof value !== 'string' || value.length > 500) return res.status(400).end();
    data[field] = value.trim();
  }
  const example = body.demande === 'exemple-tender';
  const contact = example ? data.contact : data.telephone;
  if (!data.entreprise || !interests.has(data.interet) || body.consent !== 'on'
      || !contact || (example ? (!data.metier || !data.zone || data.interet !== 'tender') : !data.nom)) {
    return res.status(422).json({ received: false });
  }
  try {
    const response = await fetch(destination, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, demande: example ? 'exemple-tender' : data.interet, source: 'hbb-site', consent: true }),
      signal: AbortSignal.timeout(8000),
    });
    const receipt = response.ok ? await response.json() : null;
    if (receipt?.received === true) return res.json({ received: true });
  } catch { /* A missing receipt must never display as a successful delivery. */ }
  return res.status(502).json({ received: false });
};
