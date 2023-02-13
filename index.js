
import RSVP from 'rsvp';
import http from 'http'
import url from 'url'
import request from 'request';

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/I/want/title/') && req.method === 'GET') {
    const queryData = url.parse(req.url, true).query;
    const addresses = Array.isArray(queryData.address) ? queryData.address : [queryData.address];

    RSVP.all(addresses.map(address => new RSVP.Promise((resolve, reject) => {
      const addressUrl = !/^https?:\/\//i.test(address) ? `http://${address}` : address;
      request({ url: addressUrl, followRedirect: true }, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          const title = body.match(/<title>(.*?)<\/title>/i);
          resolve({ address, title: title ? title[1] : 'No Response' });
        }
      });
    })))
      .then(results => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><head></head><body><h1> Following are the titles of given websites: </h1><ul>');
        results.forEach(result => {
          res.write(`<li>${result.address} - "${result.title}"</li>`);
        });
        res.end('</ul></body></html>');
      })
      .catch(error => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(3000);
console.log('Server running at http://localhost:3000');
