// Place your server entry point code here
const express = require('express');
const minimist = require('minimist');
const morgan = require('morgan');
const logdb = require('./src/services/database.js')

const fs = require('fs');
const app = express()

var args = minimist(process.argv.slice(2));
var allowedName = 'port';
const HTTP_PORT = args[allowedName] || 5555;

// Serve static HTML files
app.use(express.static('./public'));

// Make Express use its own built-in body parser for both urlencoded and JSON body data.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = args.port || args.p || process.env.PORT || 5000



// if helped is asked, show the message below, then exit with code 0 
const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)

// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}
// create log file
if (args.log == 'false') {
    console.log("NOTICE: not creating file access.log")
} else {
// Use morgan for logging to files
    const logdir = './log/';
    if (!fs.existsSync(logdir)){
        fs.mkdirSync(logdir);
}}

app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
    //console.log(info)
    next();
})

// flip one coin 
function coinFlip() {
    let number = Math.random()
    if (number > 0.5) {
      return "heads"
    } else {
      return "tails"
    }
}
// flip many coins
function coinFlips(flips) {
    var res = [];
    for (let i = 0; i < flips; i++) {
      res.push(coinFlip())
    }
    return res
  }

// count flips 
function countFlips(array) {
    let numheads = 0;
    let numtails = 0;
  
    for (let i = 0; i < array.length; i++) {
      if (array[i] == 'heads') {
        numheads = numheads + 1;
      }
      if (array[i] == 'tails') {
        numtails = numtails + 1;
      }
    }
  
    if (numheads == 0) {
      return {"tails": numtails};
    }
    else if (numtails == 0) {
      return {"heads": numheads};
    }
    return {'heads': numheads, 'tails': numtails}
  }

  // call a coin flip 

  function flipACoin(call) {
    let number = Math.random()
    let flip = ""
    if (number > 0.5) {
      flip =  "heads"
    } else {
      flip = "tails"
    }
    let result = ""
    if (flip == call) {
      result = "win"
    } else {
      result = "lose"
    }
    return {call: call, flip: flip, result: result}
    
  }
  // READ (HTTP method GET) at root endpoint /app/
app.get("/app/", (req, res, next) => {
    res.json({"message":"Your API works! (200)"});
	res.status(200);
});

// Endpoint /app/flip/ that returns JSON {"flip":"heads"} or {"flip":"tails"} 
// corresponding to the results of the random coin flip.
app.get('/app/flip/', (req, res) => {
    const flip = coinFlip()
    res.status(200).json({ "flip" : flip })
});

app.post('/app/flip/coins/', (req, res, next) => {
    const flips = coinFlips(req.body.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
})

app.get('/app/flips/:number', (req, res, next) => {
    const flips = coinFlips(req.params.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
});

app.post('/app/flip/call/', (req, res, next) => {
    const game = flipACoin(req.body.guess)
    res.status(200).json(game)
})

app.get('/app/flip/call/:guess(heads|tails)/', (req, res, next) => {
    const game = flipACoin(req.params.guess)
    res.status(200).json(game)
})

if (args.debug || args.d) {
    app.get('/app/log/access/', (req, res, next) => {
        const stmt = logdb.prepare("SELECT * FROM accesslog").all();
	    res.status(200).json(stmt);
    })

    app.get('/app/error/', (req, res, next) => {
        throw new Error('Error test works.')
    })
}

// Default API endpoint that returns 404 Not found for any endpoints that are not defined.
app.use(function(req, res){
    const statusCode = 404
    const statusMessage = 'NOT FOUND'
    res.status(statusCode).end(statusCode+ ' ' +statusMessage)
});

// Start server
const server = app.listen(port, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",port))
});
// Tell STDOUT that the server is stopped
process.on('SIGINT', () => {
    server.close(() => {
		console.log('\nApp stopped.');
	});
});