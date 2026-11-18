/**
 * Shared handle validation.
 *
 * Rules: non-empty, max 40 chars, only [A-Za-z0-9_.-] allowed.
 * Returns the trimmed handle, or throws an error with status 400.
 */
const HANDLE_RE = /^[A-Za-z0-9_.-]{1,40}$/;

function validateHandle(raw) {
  const handle = typeof raw === "string" ? raw.trim() : "";
  if (!handle) {
    const e = new Error("Handle is required");
    e.status = 400;
    throw e;
  }
  if (handle.length > 40) {
    const e = new Error("Handle must not exceed 40 characters");
    e.status = 400;
    throw e;
  }
  if (!HANDLE_RE.test(handle)) {
    const e = new Error("Handle may only contain letters, digits, underscores, hyphens and dots");
    e.status = 400;
    throw e;
  }
  return handle;
}

/**
 * Express middleware that validates req.params.handle using validateHandle().
 * Passes control to next() on success (and writes the cleaned value back to
 * req.params.handle). Returns 400 on invalid input.
 */
function validateHandleMiddleware(req, res, next) {
  try {
    req.params.handle = validateHandle(req.params.handle);
    next();
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
}

module.exports = { validateHandle, validateHandleMiddleware };
