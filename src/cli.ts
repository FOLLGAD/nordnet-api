import { Nordnet } from "./nordnet";
import * as asciichart from "asciichart";

// read stdin username then password
const username = process.env.NN_USER;
const password = process.env.NN_PASS;

if (!username || !password) {
  console.log("Usage: node main.js");
  process.exit(1);
}

const nordnet = new Nordnet();

const sign = (n: number) => (n > 0 ? "+" : "-");

const printColorCode = (n: number) => {
  if (n > 0) {
    return "\x1b[32m";
  } else if (n < 0) {
    return "\x1b[31m";
  } else {
    return "";
  }
};

nordnet.login(username, password).then(async () => {
  const perf = await nordnet.performance({ aggregate: true, period: "month" });
  const today = perf[perf.length - 1]!;
  const chart = asciichart.plot(
    perf.map((p) => p.accumulated_result.value),
    {
      height: 20,
      colors: [asciichart.blue],
    }
  );

  const endCode = "\x1b[0m";
  const boldCode = "\x1b[1m";
  const accountResult = await nordnet.get_accounts();

  const accounts = await Promise.all(
    accountResult.map(async (account) => {
      const accountResult = await nordnet.get_account(account.accid);
      return accountResult;
    })
  );

  const totalMoney = accounts.reduce(
    (acc, a) => acc + a.full_marketvalue.value,
    0
  );

  console.log(`TOTAL: ${totalMoney.toFixed(2)} SEK`);
  console.log(chart);
  console.log(
    `
Today's performance:
${sign(today.result.value)}${Math.abs(today.result.value).toFixed(2)}
${printColorCode(today.returns)}${boldCode}${today.returns}${endCode}%
  `.trim()
  );
});
