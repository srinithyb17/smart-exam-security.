const app = require('./server');
const runTestSuite = require('./test_suite');

setTimeout(async () => {
  try {
    await runTestSuite();
    console.log('\nClosing test server...');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    process.exit(1);
  }
}, 1200);
