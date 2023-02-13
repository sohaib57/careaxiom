const http = require('http');
const url = require('url');
const async = require('async');
const request = require('request');

const server = http.createServer((req, res) => {
    
  if (req.url.startsWith('/I/want/title/') && req.method === 'GET') {
    const queryData = url.parse(req.url, true).query;
    const addresses = Array.isArray(queryData.address) ? queryData.address : [queryData.address];


    async.map(addresses, (address, callback) => {
      const addressUrl = !/^https?:\/\//i.test(address) ? `http://${address}` : address;
      request({ url: addressUrl, followRedirect: true }, (error, response, body) => {
        if (error) {
          callback(null, { address, title: 'No Response' });
          return;
        }

        const title = body.match(/<title>(.*?)<\/title>/i);
        callback(null, { address, title: title ? title[1] : 'No Response' });
      });
    }, (error, results) => {
      if (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write('<html><head></head><body><h1> Following are the titles of given websites: </h1><ul>');
      results.forEach((result) => {
        res.write(`<li>${result.address} - "${result.title}"</li>`);
      });
      res.end('</ul></body></html>');
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(3000);
console.log('Server running at http://localhost:3000');
