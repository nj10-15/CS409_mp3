export function parseJSONParam(value, fallback = undefined) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    const err = new Error('Badly formatted JSON in query string.');
    err.status = 400;
    throw err;
  }
}

export function buildQuery(model, req, { defaultLimit } = {}) {
  const where = parseJSONParam(req.query.where, {});
  const sort = parseJSONParam(req.query.sort, undefined);
  const select = parseJSONParam(req.query.select, undefined);
  const skip = req.query.skip ? Number(req.query.skip) : undefined;
  let limit =
    req.query.limit !== undefined
      ? Number(req.query.limit)
      : defaultLimit ?? undefined;
  if (Number.isNaN(limit)) limit = defaultLimit;

  let q = model.find(where);
  if (sort) q = q.sort(sort);
  if (select) q = q.select(select);
  if (skip !== undefined) q = q.skip(skip);
  if (limit !== undefined) q = q.limit(limit);

  const count = String(req.query.count).toLowerCase() === 'true';
  return { q, count, where, sort, select };
}

export function applySelectToIdQuery(q, req) {
  const select = parseJSONParam(req.query.select, undefined);
  return select ? q.select(select) : q;
}
