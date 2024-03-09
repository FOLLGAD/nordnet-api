import { Nordnet } from "./nordnet";

// read stdin username then password
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.log("Usage: node main.js <username> <password>");
  process.exit(1);
}

const nordnet = new Nordnet();

nordnet.login(username, password).then(() => {
  nordnet.performance();
});
