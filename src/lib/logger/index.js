'use strict';

const fs = require('fs');
const path = require('path');
const winston = require('winston');

/* ──────────────────────── file logger ───────────────────────── */
const LOG_DIR = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

const now = new Date();
const timestamp = now
  .toISOString()
  .replace(/[:.]/g, '-') // sanitize for filenames
  .replace('T', '_')
  .split('Z')[0];

const filename = `slow-queries_${timestamp}.log`;

const slowQueryLog = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) =>
        `[${timestamp}] [${level.toUpperCase()}] ${message}`,
    ),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, filename),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

/* ──────────────── internal trace‑map and helpers ────────────── */
const stackById = new Map();
const TRACE_RE = /\/\*TRACE:([a-z0-9]+)\*\//i;

function newTraceId() {
  return Math.random().toString(36).slice(2, 10);
}

function addTraceComment(sql, id) {
  return `/*TRACE:${id}*/ ${sql}`;
}

function extractTraceId(sql) {
  const m = TRACE_RE.exec(sql);
  return m ? m[1] : null;
}

function stripTraceComment(sql) {
  return sql.replace(TRACE_RE, '').trim();
}

/* ─────────────── public: patch + logger fn ──────────────────── */
/* ───── trace patch: safe clone, no side-effects ───────────────── */
function enableSqlTracing(sequelize) {
  const origQuery = sequelize.query.bind(sequelize);

  sequelize.query = async function tracedQuery(rawSql, options = {}) {
    const id = newTraceId();

    /* capture stack (for logger) */
    const stack = new Error().stack
      .split('\n')
      .slice(2)
      .filter(
        (l) =>
          !l.includes('node_modules') &&
          (l.includes('.js') || l.includes('.ts')),
      )
      .map((l) => l.trim())
      .join('\n');

    stackById.set(id, stack);

    /* build a *new* arg so callers don’t see our modifications   */
    let sqlArg = rawSql;
    if (typeof rawSql === 'string') {
      sqlArg = addTraceComment(rawSql, id);
    } else if (rawSql && typeof rawSql === 'object' && rawSql.query) {
      sqlArg = {
        ...rawSql, // shallow copy → zero impact
        query: addTraceComment(rawSql.query, id),
      };
    }

    try {
      return await origQuery(sqlArg, options); // execute with clone
    } finally {
      // keep trace until logger consumes it, then auto-delete
    }
  };
}

/**
 * The logging function you pass to Sequelize config.
 */
function slowQueryLogger(sql, timingOrOpts) {
  const elapsed = typeof timingOrOpts === 'number' ? timingOrOpts : null;

  /* Only interested in slow queries */
  if (elapsed !== null && elapsed < 300) return;

  const id = extractTraceId(sql);
  const stack = id ? stackById.get(id) || 'unavailable' : 'unavailable';
  if (id) stackById.delete(id);

  const cleanSql = stripTraceComment(sql);

  slowQueryLog.warn(
    `[SLOW QUERY - ${elapsed ?? '??'}ms]\n` +
      `↪ Trace‑ID: ${id || 'n/a'}\n${stack}\n${cleanSql}\n`,
  );
}

module.exports = {
  enableSqlTracing,
  slowQueryLogger,
};
