type BrandedType<T, Brand> = T & {
    readonly __brand: Brand;
};
type AccountNumber = BrandedType<number, "AccountNumber">;
type AccountID = BrandedType<number, "AccountID">;
interface PerformanceDay {
    time: number;
    date: string;
    accumulated_returns: number;
    accumulated_result: {
        currency: string;
        value: number;
    };
    returns: number;
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
export declare class Nordnet {
    cookie: string | undefined;
    renew_session(): Promise<string>;
    private cleanCookies;
    login(username: string, password: string): Promise<void>;
    get_account(accountId: AccountID): Promise<AccountValue>;
    get_accounts(): Promise<AccountInfo[]>;
    performance(options: {
        period?: "month" | "year" | "quarter";
    } & ({
        aggregate: true;
    } | {
        aggregate?: false;
        account_number: string;
    })): Promise<PerformanceDay[]>;
}
export {};
