import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
export function assertMonadForgeVersion(version) {
  const match = /Version:\s*(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match || Number(match[1]) < 1 || (Number(match[1]) === 1 && Number(match[2]) < 8)) {
    throw new Error("Monad deployment requires official Foundry >=1.8.0 with --network monad support");
  }
}

export async function compileMonadContract() {
  const {stdout} = await run("forge", ["--version"]);
  assertMonadForgeVersion(stdout);
  await run("forge", ["build"], {maxBuffer: 10 * 1024 * 1024});
}

export async function verifyMonadContract(address) {
  await run("forge", ["verify-contract", address, "contracts/src/IrukaPackBatch.sol:IrukaPackBatch",
    "--chain", "10143", "--verifier", "sourcify",
    "--verifier-url", "https://sourcify-api-monad.blockvision.org/", "--watch"], {maxBuffer: 10 * 1024 * 1024});
}
