// Middleware function definitions go here
// Middleware function definitions go here
const db = require('../services/database.js')

function log (req, res, next) {

        let logdata = {
            remoteaddr: req.ip,
            remoteuser: req.user,
            time: Date.now(),
            method: req.method,
            url: req.url,
            protocol: req.protocol,
            httpversion: req.httpVersion,
            status: res.statusCode,
            referrer: req.headers["referer"],
            useragent: req.headers["user-agent"],
        };
        const stmt = db.prepare(
            "INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        const info = stmt.run(
            logdata.remoteaddr,
            logdata.remoteuser,
            logdata.time,
            logdata.method,
            logdata.url,
            logdata.protocol,
            logdata.httpversion,
            logdata.status,
            logdata.referrer,
            logdata.useragent
        );
        next();
}

module.exports = log;