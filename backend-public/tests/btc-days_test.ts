import { mintBoomDays } from "./client/boom-nfts.ts";
import { upgrade } from "./client/btc-days-mint.ts";
import {
  transfer,
  setApproved,
  isApproved,
  upgrade as upgradeNft,
} from "./client/btc-days.ts";
import {
  Clarinet,
  Tx,
  Chain,
  Account,
  assertEquals,
  types
} from "./client/deps.ts";

Clarinet.test({
  name: "User can't call upgrade directly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let block = chain.mineBlock([upgradeNft(1, deployer)]);
    block.receipts[0].result.expectErr().expectUint(403);
  },
});

Clarinet.test({
  name: "User can transfer upgraded days",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock(mintBoomDays(wallet1));
    assertEquals(block.receipts.length, 600);
    block = chain.mineBlock([
      upgrade(1, wallet1),
      isApproved(1, wallet1.address, wallet1),
      transfer(1, wallet1, deployer, wallet1),
      isApproved(1, wallet1.address, wallet1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectOk().expectBool(false);

    assertEquals(block.receipts[2].events.length, 1);
    block.receipts[2].events[0].nft_transfer_event.value.expectUint(1);
  },
});

Clarinet.test({
  name: "User can't transfer old days with this contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock(mintBoomDays(wallet1));
    assertEquals(block.receipts.length, 600);
    block = chain.mineBlock([transfer(1, deployer, wallet1, deployer)]);
    block.receipts[0].result.expectErr().expectUint(404);
  },
});

Clarinet.test({
  name: "User can only transfer if approved",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    let wallet2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock(mintBoomDays(wallet1));
    assertEquals(block.receipts.length, 600);
    block = chain.mineBlock([
      upgrade(1, wallet1),
      // operator not approved yet
      isApproved(1, wallet2.address, wallet1),
      transfer(1, wallet1, deployer, wallet2),
      setApproved(1, wallet2, true, wallet1),
      // operator can transfer
      transfer(1, wallet1, deployer, wallet2),
      // old owner can't transfer
      transfer(1, deployer, wallet2, wallet1),
      setApproved(1, wallet2, true, wallet1),
      // operator not approved anymore
      transfer(1, deployer, wallet2, wallet2),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(false); // operator not approved
    block.receipts[2].result.expectErr().expectUint(403);
    block.receipts[3].result.expectOk().expectBool(true); // set approved true
    block.receipts[4].result.expectOk().expectBool(true); // transfer by operator
    block.receipts[5].result.expectErr().expectUint(403); // transfer by old owner
    block.receipts[6].result.expectOk().expectBool(true); // set approved false
    block.receipts[7].result.expectErr().expectUint(403); // transfer by disaproved operator
  },
});

Clarinet.test({
  name: "Marketplace is approved by default",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      isApproved(1, deployer.address + ".marketplace", wallet1),
      isApproved(1, deployer.address, wallet1),
      Tx.contractCall("btc-days", "get-marketplace", [], deployer.address),
    ]);
    // NFT not yet upgraded
    block.receipts[0].result.expectErr().expectUint(404);
    block.receipts[1].result.expectErr().expectUint(404);
    block.receipts[2].result.expectPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.btc-days-marketplace");

    block = chain.mineBlock(mintBoomDays(wallet1));
    assertEquals(block.receipts.length, 600);

    block = chain.mineBlock([
      upgrade(1, wallet1),
      isApproved(1, deployer.address + ".btc-days-marketplace", wallet1),
      isApproved(1, deployer.address, wallet1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true); // upgrade
    block.receipts[1].result.expectOk().expectBool(true); // marketplace approved
    block.receipts[2].result.expectOk().expectBool(false); // normal user not approved
  },
});
