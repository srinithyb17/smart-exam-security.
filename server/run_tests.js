const app = require('./server');
const db = require('./database');
const runTestSuite = require('./test_suite');

async function main() {
  await db.init();
  const server = app.listen(5000, async () => {
    try {
      await runTestSuite();
      console.log('\nClosing test server...');
      server.close(() => process.exit(0));
    } catch (err) {
      console.error('\n❌ Test Suite Failed:', err);
      server.close(() => process.exit(1));
    }
  });
}

main();
