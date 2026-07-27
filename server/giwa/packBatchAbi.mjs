export const packBatchAbi = [
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
    name: "previewDraw",
    stateMutability: "view",
    inputs: [
      { name: "batchId", type: "bytes32" },
      { name: "requestId", type: "uint64" },
      { name: "serverSeed", type: "bytes32" },
      { name: "seedProof", type: "bytes32[]" }
    ],
    outputs: [
      { name: "position", type: "uint32" },
      { name: "inventoryIndex", type: "uint32" }
    ]
  },
  {
    type: "function",
    name: "fulfillPull",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "uint64" },
      { name: "serverSeed", type: "bytes32" },
      { name: "seedProof", type: "bytes32[]" },
      { name: "inventoryId", type: "bytes32" },
      { name: "inventoryProof", type: "bytes32[]" }
    ],
    outputs: []
  }
];
