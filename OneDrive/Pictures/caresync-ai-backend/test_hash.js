import bcrypt from 'bcryptjs';

const hash = "$2a$10$Us5ngpcKNkF0ali7gs4pmeIrMXvXwV44COoDAjUHcmSjOWJyr.uNa";
const pwd = "password123";

const matches = await bcrypt.compare(pwd, hash);
console.log("Password matches:", matches);
