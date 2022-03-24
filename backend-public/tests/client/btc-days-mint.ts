import {
  Tx,
  Chain,
  Account,
  types,
} from "./deps.ts";

export function toBoom(id: number, chain: Chain, user: Account) {
  return chain.callReadOnlyFn(
    "btc-days-mint",
    "to-boom",
    [types.uint(id)],
    user.address
  );
}

export function upgrade(id: number, user: Account) {
  return Tx.contractCall(
    "btc-days-mint",
    "upgrade",
    [types.uint(id)],
    user.address
  );
}
