import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

try {
  await client.connect();
  console.log('✅ Connection Success to port 54322!');
  const res = await client.query('SELECT NOW()');
  console.log('Time:', res.rows[0]);
  await client.end();
} catch (err) {
  console.error('❌ Connection Failed to port 54322:', err.message);
}
