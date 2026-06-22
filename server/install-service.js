const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'JAE TCRMS Server',
  description: 'JAE Philippines Training and Certification Record Management System Server',
  script: path.join(__dirname, 'src', 'index.js'),
  nodeOptions: [],
  workingDirectory: __dirname,
  allowServiceLogon: true,
});

svc.on('install', () => {
  console.log('Service installed! Starting...');
  svc.start();
});

svc.on('start', () => {
  console.log('JAE TCRMS Server service started.');
  console.log('It will now start automatically with Windows.');
});

svc.on('error', (err) => {
  console.error('Service error:', err);
});

if (!svc.exists) {
  console.log('Installing JAE TCRMS Server as Windows service...');
  svc.install();
} else {
  console.log('Service already installed. Restarting...');
  svc.restart();
}
