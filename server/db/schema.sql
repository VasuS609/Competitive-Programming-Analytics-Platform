
-- CREATE TABLE sqlite_scheam(
--     type text,
--     name text,
--     tbl_name text,
--     rootpage integer,
--     sql text
-- );

CREATE TABLE IF NOT EXISTS problem(
    id INTEGER PRIMARY KEY,
    date TEXT,
    name TEXT,
    url TEXT,
    rating INTEGER,
    source TEXT,
    tags TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP -- created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals(
    id INTEGER PRIMARY KEY,
    rating INTEGER,
    count_required INTEGER,
    active BOOLEAN
);

CREATE TABLE IF NOT EXISTS solved_problems(
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    problem_id TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT,
    rating INTEGER,
    tags TEXT,
    first_seen_at TEXT NOT NULL,
    PRIMARY KEY(platform, handle, problem_id)
);