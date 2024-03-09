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

  async get_account() {
    const response = await fetch(
      "https://www.nordnet.se/api/2/accounts/3/positions?include_instrument_loans=true",
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

    const account = await response.json();
    console.log(account);
  }

  async performance() {
    const response = await fetch(
      "https://www.nordnet.se/api/2/accounts/1%2C3/returns/performance?period=m1&start_at_zero=false&resolution=DAY",
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

    const account: {
      accid?: number;
      account_number?: number;
      aggregated: boolean;
      performance_ticks: PerformanceDay[];
    }[] = await response.json();

    const aggregated = account?.find(
      (a: any) => a.aggregated
    )?.performance_ticks;
    console.log(aggregated?.slice(-1)[0]);
  }
}
