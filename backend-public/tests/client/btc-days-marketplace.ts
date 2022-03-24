import { Tx, Account, types } from "./deps.ts";


export function list(
  id: number,
  price: number,
  commission: string,
  user: Account
) {
  return Tx.contractCall(
    "btc-days-marketplace",
    "list-in-ustx",
    [types.uint(id), types.uint(price), types.principal(commission)],
    user.address
  );
}

export function unlist(id: number, user: Account) {
  return Tx.contractCall(
    "btc-days-marketplace",
    "unlist-in-ustx",
    [types.uint(id)],
    user.address
  );
}

export function buy(id: number, commission: string, user: Account) {
  return Tx.contractCall(
    "btc-days-marketplace",
    "buy-in-ustx",
    [types.uint(id), types.principal(commission)],
    user.address
  );
}
