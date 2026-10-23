const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const databasePath = path.join(__dirname, 'tracker.db');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
const database = new Database(databasePath);
database.exec(schema);

function prepare(sql) {
	const statement = database.prepare(sql);
	return {
		run(...values) {
			return statement.run(...values);
		},
		all(...values) {
			return statement.all(...values);
		},
	};
}

module.exports = {
	prepare,
	transaction(callback) {
		return database.transaction(callback);
	},
};
