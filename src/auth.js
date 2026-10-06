import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { chmodSync, mkdirSync } from "node:fs";
import { chmod, mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "file_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function readSessionCookie(req) {
  const cookies = (req.headers.cookie ?? "").split(";");

  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator).trim() !== SESSION_COOKIE) {
      continue;
    }

    try {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }

  return null;
}

function setSessionCookie(res, token) {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];

  if (process.env.COOKIE_SECURE === "true") {
    attributes.push("Secure");
  }

  res.setHeader("Set-Cookie", attributes.join("; "));
}

function clearSessionCookie(res) {
  const attributes = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (process.env.COOKIE_SECURE === "true") {
    attributes.push("Secure");
  }

  res.setHeader("Set-Cookie", attributes.join("; "));
}

export function createAuth({ root, dataDirectory = process.env.FILE_SERVER_DATA_DIR }) {
  const usersDirectory = path.join(root, "users");
  const authDirectory = path.resolve(dataDirectory || path.join(root, ".file-server-data"));

  mkdirSync(usersDirectory, { recursive: true, mode: 0o700 });
  chmodSync(usersDirectory, 0o700);
  mkdirSync(authDirectory, { recursive: true, mode: 0o700 });
  chmodSync(authDirectory, 0o700);

  const databasePath = path.join(authDirectory, "auth.sqlite");
  const database = new DatabaseSync(databasePath);
  chmodSync(databasePath, 0o600);
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
  `);
  database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());

  const findUser = database.prepare(
    "SELECT id, username, password_salt, password_hash FROM users WHERE username = ?"
  );
  const insertUser = database.prepare(
    "INSERT OR IGNORE INTO users (username, password_salt, password_hash) VALUES (?, ?, ?)"
  );
  const insertSession = database.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)"
  );

  function createSession(res, user) {
    const token = randomBytes(32).toString("base64url");
    insertSession.run(hashToken(token), user.id, Date.now() + SESSION_TTL_MS);
    setSessionCookie(res, token);
    res.json({ user: { id: user.id, username: user.username } });
  }

  async function register(req, res, next) {
    const username = typeof req.body?.username === "string"
      ? req.body.username.trim().toLowerCase()
      : "";
    const password = req.body?.password;

    if (!USERNAME_PATTERN.test(username)) {
      return res.status(400).json({
        message: "Username must be 3-32 characters: letters, numbers, dots, dashes or underscores.",
      });
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
    }

    try {
      const salt = randomBytes(16).toString("hex");
      const passwordHash = (await scrypt(password, salt, 64)).toString("hex");
      const result = insertUser.run(username, salt, passwordHash);

      if (result.changes === 0) {
        return res.status(409).json({ message: "That username is already registered." });
      }

      const user = { id: Number(result.lastInsertRowid), username };

      try {
        const userDirectory = path.join(usersDirectory, String(user.id));
        await mkdir(userDirectory, {
          recursive: true,
          mode: 0o700,
        });
        await chmod(userDirectory, 0o700);
      } catch (error) {
        database.prepare("DELETE FROM users WHERE id = ?").run(user.id);
        throw error;
      }

      createSession(res, user);
    } catch (error) {
      next(error);
    }
  }

  async function login(req, res, next) {
    const username = typeof req.body?.username === "string"
      ? req.body.username.trim().toLowerCase()
      : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    try {
      const userRecord = findUser.get(username);
      const salt = userRecord?.password_salt ?? "invalid-account-salt";
      const candidateHash = await scrypt(password, salt, 64);
      const expectedHash = Buffer.from(userRecord?.password_hash ?? "0".repeat(128), "hex");

      if (!userRecord || !timingSafeEqual(candidateHash, expectedHash)) {
        return res.status(401).json({ message: "Invalid username or password." });
      }

      const user = { id: userRecord.id, username: userRecord.username };
      const userDirectory = path.join(usersDirectory, String(user.id));
      await mkdir(userDirectory, {
        recursive: true,
        mode: 0o700,
      });
      await chmod(userDirectory, 0o700);
      createSession(res, user);
    } catch (error) {
      next(error);
    }
  }

  function loadSession(req, res, next) {
    const token = readSessionCookie(req);

    if (!token) {
      return next();
    }

    const tokenHash = hashToken(token);
    const session = database.prepare(`
      SELECT users.id, users.username, sessions.expires_at
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
    `).get(tokenHash);

    if (!session || session.expires_at <= Date.now()) {
      database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
      clearSessionCookie(res);
      return next();
    }

    req.user = { id: session.id, username: session.username };
    req.userRoot = path.join(usersDirectory, String(session.id));
    req.sessionTokenHash = tokenHash;
    res.setHeader("Cache-Control", "no-store");
    next();
  }

  function requireAuth(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    next();
  }

  function logout(req, res) {
    database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(req.sessionTokenHash);
    clearSessionCookie(res);
    res.status(204).end();
  }

  function me(req, res) {
    res.json({ user: req.user });
  }

  return {
    loadSession,
    requireAuth,
    register,
    login,
    logout,
    me,
    close: () => database.close(),
  };
}