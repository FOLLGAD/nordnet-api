# Nordnet API

Unofficial Node.js API for Swedish Nordnet.

## Install

```bash
$ npm install nordnet-unofficial-api
```

## supported functionality

### Login

```javascript
import { Nordnet } from 'nordnet-unofficial-api';

const nordnet = new Nordnet();
await nordnet.login('username', 'password');
```

### Get accounts
    
```javascript
// ...

const accounts = await nordnet.get_accounts();
console.log(accounts);
```

### Get account information

```javascript
// ...

const account = await nordnet.get_account(account_id);
console.log(account);
```

### Get weekly/monthly/yearly performance
    
```javascript
// ...

const accountPerformance = await nordnet.get_performance({ account_id, period: 'week' });
const totalPerformance = await nordnet.get_performance({ aggregate: true, period: 'month' });
```