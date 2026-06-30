const http = require('http');

const data = JSON.stringify({
  config: [
    { key: 'feature_ocr_active', value: 'false', teaseMode: true }
  ]
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/admin/app-config',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', body));
});

req.write(data);
req.end();
