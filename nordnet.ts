import { cache } from "./cache";

type BrandedType<T, Brand> = T & { readonly __brand: Brand };

type AccountNumber = BrandedType<number, "AccountNumber">;
type AccountID = BrandedType<number, "AccountID">;

interface PerformanceDay {
  time: number;
  date: string;
  accumulated_returns: number; // accum. percent return
  accumulated_result: {
    currency: string;
    value: number;
  };
  returns: number; // percent return
  result: {
    currency: string;
    value: number;
  };
}

interface AccountValue {
  full_marketvalue: {
    currency: string;
    value: number;
  };
  own_capital: {
    currency: string;
    value: number;
  };
  own_capital_morning: {
    currency: string;
    value: number;
  };
  account_sum: {
    currency: string;
    value: number;
  };
  accno: AccountNumber;
  accid: AccountID;
  equity: {
    currency: string;
    value: number;
  };
  account_code: "ISK" | "FKF" | "AF";
  registration_date: string;
  interest_rate: number;
}

interface AccountInfo {
  accno: AccountNumber;
  accid: AccountID;
  bank_accno: string;
  type: string;
  atyid: number;
  symbol: string;
  account_code: string;
  role: string;
  default: boolean;
  alias: string;
}

export class Nordnet {
  cookie: string;

  async renew_session() {
    const cookies = await fetch("https://www.nordnet.se", {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
        getSetCookie: "",
      },
    }).then((response) => {
      const cookies = response.headers.get("set-cookie");
      return cookies ?? "";
    });

    return this.cleanCookies(cookies);
  }

  private cleanCookies(cookies: string) {
    return cookies
      .split(", ")
      .map((c) => c.split(";")[0])
      .join("; ");
  }

  async login(username: string, password: string) {
    const cookies = await this.renew_session();

    const response = await fetch(
      "https://www.nordnet.se/api/2/authentication/basic/login",
      {
        method: "POST",
        headers: {
          "client-id": "NEXT",
          "Content-Type": "application/json",
          Cookie: cookies,
        },
        body: JSON.stringify({
          username,
          password,
        }),
      }
    );
    this.cookie = this.cleanCookies(response.headers.get("set-cookie") ?? "");
  }

  async get_account(accountId: AccountID): Promise<AccountValue> {
    const response = await fetch(
      `https://www.nordnet.se/api/2/accounts/${accountId}`,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
          "client-id": "NEXT",
          "Content-Type": "application/json",
          Cookie: this.cookie,
        },
      }
    );

    const account = (await response.json()) as AccountValue;

    return account;
  }

  // @ts-ignore
  @cache(300 * 1000)
  async get_accounts() {
    console.time("get_accounts");
    const response = await fetch("https://www.nordnet.se/api/2/accounts", {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
        "client-id": "NEXT",
        "Content-Type": "application/json",
        Cookie: this.cookie,
      },
    });

    const accounts = (await response.json()) as AccountInfo[];
    console.timeEnd("get_accounts");

    return accounts;
  }

  async performance(
    options: {
      period?: "month" | "year" | "quarter";
    } & ({ aggregate: true } | { aggregate?: false; account_number: string })
  ) {
    const periodParam = {
      week: "w1",
      month: "m1",
      year: "y1",
      quarter: "m3",
    }[options.period ?? "month"];

    const accounts = await this.get_accounts();
    const accidLow = Math.min(...accounts.map((a) => a.accid));
    const accidHigh = Math.max(...accounts.map((a) => a.accid));

    const response = await fetch(
      `https://www.nordnet.se/api/2/accounts/${accidLow}%2C${accidHigh}/returns/performance?period=${periodParam}&start_at_zero=false&resolution=DAY`,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
          "client-id": "NEXT",
          "Content-Type": "application/json",
          Cookie: this.cookie,
        },
      }
    );

    if (!response.ok) {
      console.log(await response.text());
      throw new Error("Failed to get performance data");
    }

    const account: {
      accid?: number;
      account_number?: number;
      aggregated: boolean;
      performance_ticks: PerformanceDay[];
    }[] = await response.json();

    const aggregated = account?.find((a: any) =>
      options.aggregate
        ? a.aggregated
        : a.account_number === options.account_number
    )?.performance_ticks;

    if (!aggregated) {
      throw new Error("No performance data found");
    }
    return aggregated;
  }
}
