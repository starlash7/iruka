import { isAddress, keccak256, stringToHex, toHex, type Address, type Hex } from "viem";

export const giwaPackBatchAbi = [
  {
    type: "function",
    name: "requestPull",
    stateMutability: "payable",
    inputs: [
      { name: "batchId", type: "bytes32" },
      { name: "clientSeed", type: "bytes32" }
    ],
    outputs: [{ name: "requestId", type: "uint64" }]
  },
  {
    type: "function",
    name: "getBatch",
    stateMutability: "view",
    inputs: [{ name: "batchId", type: "bytes32" }],
    outputs: [
      { name: "totalSupply", type: "uint32" },
      { name: "available", type: "uint32" },
      { name: "remaining", type: "uint32" },
      { name: "priceWei", type: "uint256" },
      { name: "inventoryRoot", type: "bytes32" },
      { name: "oddsCommitment", type: "bytes32" },
      { name: "drawSeedRoot", type: "bytes32" },
      { name: "nextDrawIndex", type: "uint32" },
      { name: "nextFulfillIndex", type: "uint32" }
    ]
  },
  {
    type: "function",
    name: "getPull",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint64" }],
    outputs: [
      { name: "collector", type: "address" },
      { name: "batchId", type: "bytes32" },
      { name: "clientSeed", type: "bytes32" },
      { name: "drawIndex", type: "uint32" },
      { name: "inventoryId", type: "bytes32" },
      { name: "inventoryIndex", type: "uint32" },
      { name: "fulfilled", type: "bool" }
    ]
  },
  {
    type: "event",
    name: "PullRequested",
    anonymous: false,
    inputs: [
      { indexed: true, name: "requestId", type: "uint64" },
      { indexed: true, name: "batchId", type: "bytes32" },
      { indexed: true, name: "collector", type: "address" },
      { indexed: false, name: "drawIndex", type: "uint32" }
    ]
  },
  {
    type: "event",
    name: "PullFulfilled",
    anonymous: false,
    inputs: [
      { indexed: true, name: "requestId", type: "uint64" },
      { indexed: true, name: "batchId", type: "bytes32" },
      { indexed: true, name: "collector", type: "address" },
      { indexed: false, name: "inventoryId", type: "bytes32" },
      { indexed: false, name: "inventoryIndex", type: "uint32" },
      { indexed: false, name: "remaining", type: "uint32" }
    ]
  }
] as const;

export function getBatchCommitmentId(batchId: string): Hex {
  return keccak256(stringToHex(batchId));
}

export function getInventoryCommitmentId(inventoryId: string): Hex {
  return keccak256(stringToHex(inventoryId));
}

export function createClientSeed(): Hex {
  const seed = new Uint8Array(32);
  crypto.getRandomValues(seed);
  return toHex(seed);
}

export function isContractAddress(value: string | undefined): value is Address {
  return typeof value === "string" && isAddress(value);
}
