import { toBoom, upgrade } from "./client/btc-days-mint.ts";
import { Clarinet, Chain, Account, assertEquals } from "./client/deps.ts";
import { mintBoomDays } from "./client/boom-nfts.ts";

Clarinet.test({
  name: "day id is mapped to boom id",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let result = toBoom(1, chain, deployer);
    result.result.expectSome().expectUint(1);
    result = toBoom(7, chain, deployer);
    result.result.expectSome().expectUint(5632);
    result = toBoom(8, chain, deployer);
    result.result.expectNone();
  },
});

Clarinet.test({
  name: "user can upgrade own boom day",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock(mintBoomDays(deployer));
    assertEquals(block.receipts.length, 600);
    block = chain.mineBlock([upgrade(1, deployer)]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[0].events[0].stx_transfer_event.amount.expectInt(60000000);
    block.receipts[0].events[1].nft_burn_event.value.expectUint(1);
    block.receipts[0].events[2].nft_mint_event.value.expectUint(1);
  },
});

Clarinet.test({
  name: "user can't upgrade own boom day twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    let block = chain.mineBlock(mintBoomDays(deployer));
    assertEquals(block.receipts.length, 600);
    block = chain.mineBlock([upgrade(1, deployer)]);
    block.receipts[0].result.expectOk();

    block = chain.mineBlock([upgrade(1, deployer)]);
    block.receipts[0].result.expectErr().expectUint(900);
  },
});
