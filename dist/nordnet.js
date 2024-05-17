var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { cache } from "./cache";
export class Nordnet {
    cookie;
    async renew_session() {
        const cookies = await fetch("https://www.nordnet.se", {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
                getSetCookie: "",
            },
        }).then((response) => {
            const cookies = response.headers.get("set-cookie");
            return cookies ?? "";
        });
        return this.cleanCookies(cookies);
    }
    cleanCookies(cookies) {
        return cookies
            .split(", ")
            .map((c) => c.split(";")[0])
            .join("; ");
    }
    async login(username, password) {
        const cookies = await this.renew_session();
        const response = await fetch("https://www.nordnet.se/api/2/authentication/basic/login", {
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
        });
        this.cookie = this.cleanCookies(response.headers.get("set-cookie") ?? "");
    }
    async get_account(accountId) {
        const response = await fetch(`https://www.nordnet.se/api/2/accounts/${accountId}`, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
                "client-id": "NEXT",
                "Content-Type": "application/json",
                Cookie: this.cookie || "",
            },
        });
        const account = (await response.json());
        return account;
    }
    // @ts-ignore
    async get_accounts() {
        console.time("get_accounts");
        const response = await fetch("https://www.nordnet.se/api/2/accounts", {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
                "client-id": "NEXT",
                "Content-Type": "application/json",
                Cookie: this.cookie || "",
            },
        });
        const accounts = (await response.json());
        console.timeEnd("get_accounts");
        return accounts;
    }
    async performance(options) {
        const periodParam = {
            week: "w1",
            month: "m1",
            year: "y1",
            quarter: "m3",
        }[options.period ?? "month"];
        const accounts = await this.get_accounts();
        const accidLow = Math.min(...accounts.map((a) => a.accid));
        const accidHigh = Math.max(...accounts.map((a) => a.accid));
        const response = await fetch(`https://www.nordnet.se/api/2/accounts/${accidLow}%2C${accidHigh}/returns/performance?period=${periodParam}&start_at_zero=false&resolution=DAY`, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
                "client-id": "NEXT",
                "Content-Type": "application/json",
                Cookie: this.cookie || "",
            },
        });
        if (!response.ok) {
            console.log(await response.text());
            throw new Error("Failed to get performance data");
        }
        const account = (await response.json());
        const aggregated = account?.find((a) => options.aggregate
            ? a.aggregated
            : a.account_number === options.account_number)?.performance_ticks;
        if (!aggregated) {
            throw new Error("No performance data found");
        }
        return aggregated;
    }
}
__decorate([
    cache(300 * 1000)
], Nordnet.prototype, "get_accounts", null);
