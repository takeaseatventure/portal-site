const { validateLicense, formatLicenseResponse } = require('../lib/license');
const { ActivationStore } = require('../lib/activation-store');

// Use /tmp for serverless writable storage
const store = new ActivationStore('/tmp/activations.json');

module.exports = (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const method = req.method;
  const pathname = req.url?.split('?')[0];

  if (method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (method === 'GET' && pathname === '/v1/health') {
    res.status(200).json({ status: 'ok', version: '1.0.0', deployed: 'vercel' });
    return;
  }

  if (method === 'POST' && (pathname === '/v1/validate' || pathname === '/v1/activate')) {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      res.status(500).json({ error: 'Server not configured' });
      return;
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { res.status(400).json({ error: 'Invalid JSON' }); return; }
    }
    if (!body) {
      try { body = JSON.parse(req.read()); } catch { res.status(400).json({ error: 'Invalid JSON' }); return; }
    }

    if (!body.key) {
      res.status(200).json({ valid: false, error: 'Missing "key" field' });
      return;
    }

    if (!body.machineId && pathname === '/v1/activate') {
      res.status(200).json({ valid: false, error: 'Missing "machineId" field' });
      return;
    }

    const result = validateLicense(body.key, secretKey);
    if (!result.valid) {
      res.status(200).json({ valid: false, error: result.error });
      return;
    }

    const payload = result.payload;

    if (body.productId && payload.p !== body.productId) {
      res.status(200).json({
        valid: false,
        error: `Key is for product "${payload.p}", not "${body.productId}"`,
      });
      return;
    }

    if (pathname === '/v1/validate') {
      const count = store.countActivations(body.key);
      res.status(200).json(formatLicenseResponse(payload, count));
      return;
    }

    const limit = payload.a || 3;
    const actResult = store.activate(body.key, body.machineId, limit);
    const response = formatLicenseResponse(payload, actResult.count);

    if (actResult.alreadyActive) {
      response.message = 'Machine already activated';
      response.activated = false;
    } else if (!actResult.activated) {
      response.valid = false;
      response.error = `Activation limit reached (${actResult.count}/${actResult.limit}). Deactivate a machine to transfer.`;
      response.activated = false;
    } else {
      response.message = 'Activated successfully';
      response.activated = true;
    }

    res.status(200).json(response);
    return;
  }

  res.status(404).json({ error: 'Not found', path: pathname });
};
