// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Testnet-only batch commitments and verifiable, without-replacement pull receipts.
contract IrukaPackBatch {
    error BatchAlreadyExists();
    error BatchNotFound();
    error IncorrectPayment();
    error InvalidInventoryProof();
    error InvalidSeed();
    error InvalidSupply();
    error NoPendingRequest();
    error NotCollector();
    error NotOwner();
    error PullNotFound();
    error RequestAlreadyPending();
    error SeedNotRevealed();

    struct Batch {
        uint32 totalSupply;
        uint32 remaining;
        uint256 priceWei;
        bytes32 inventoryRoot;
        bytes32 oddsCommitment;
        bytes32 serverSeedCommitment;
        uint64 pendingRequestId;
        mapping(uint32 => uint32) indexSwaps;
    }

    struct PullRequest {
        address collector;
        bytes32 batchId;
        bytes32 clientSeedCommitment;
        bytes32 clientSeed;
        bytes32 inventoryId;
        uint32 inventoryIndex;
        bool clientSeedRevealed;
        bool fulfilled;
    }

    address public immutable owner;
    uint64 public nextRequestId;
    mapping(bytes32 => Batch) private batches;
    mapping(bytes32 => bool) private committedBatches;
    mapping(uint64 => PullRequest) private pullRequests;

    event BatchCommitted(
        bytes32 indexed batchId,
        uint32 totalSupply,
        uint256 priceWei,
        bytes32 inventoryRoot,
        bytes32 oddsCommitment,
        bytes32 serverSeedCommitment
    );
    event PullRequested(uint64 indexed requestId, bytes32 indexed batchId, address indexed collector);
    event ClientSeedRevealed(uint64 indexed requestId);
    event PullFulfilled(
        uint64 indexed requestId,
        bytes32 indexed batchId,
        address indexed collector,
        bytes32 inventoryId,
        uint32 inventoryIndex,
        uint32 remaining
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function commitBatch(
        bytes32 batchId,
        uint32 totalSupply,
        uint256 priceWei,
        bytes32 inventoryRoot,
        bytes32 oddsCommitment,
        bytes32 serverSeedCommitment
    ) external onlyOwner {
        if (committedBatches[batchId]) revert BatchAlreadyExists();
        if (
            totalSupply == 0 || inventoryRoot == bytes32(0)
                || oddsCommitment == bytes32(0) || serverSeedCommitment == bytes32(0)
        ) revert InvalidSupply();

        Batch storage batch = batches[batchId];
        batch.totalSupply = totalSupply;
        batch.remaining = totalSupply;
        batch.priceWei = priceWei;
        batch.inventoryRoot = inventoryRoot;
        batch.oddsCommitment = oddsCommitment;
        batch.serverSeedCommitment = serverSeedCommitment;
        committedBatches[batchId] = true;

        emit BatchCommitted(
            batchId,
            totalSupply,
            priceWei,
            inventoryRoot,
            oddsCommitment,
            serverSeedCommitment
        );
    }

    function requestPull(bytes32 batchId, bytes32 clientSeedCommitment)
        external
        payable
        returns (uint64 requestId)
    {
        Batch storage batch = _getBatch(batchId);
        if (batch.pendingRequestId != 0) revert RequestAlreadyPending();
        if (batch.remaining == 0) revert InvalidSupply();
        if (msg.value != batch.priceWei) revert IncorrectPayment();
        if (clientSeedCommitment == bytes32(0)) revert InvalidSeed();

        requestId = ++nextRequestId;
        pullRequests[requestId] = PullRequest({
            collector: msg.sender,
            batchId: batchId,
            clientSeedCommitment: clientSeedCommitment,
            clientSeed: bytes32(0),
            inventoryId: bytes32(0),
            inventoryIndex: 0,
            clientSeedRevealed: false,
            fulfilled: false
        });
        batch.pendingRequestId = requestId;

        emit PullRequested(requestId, batchId, msg.sender);
    }

    function revealClientSeed(uint64 requestId, bytes32 clientSeed) external {
        PullRequest storage request = _getPull(requestId);
        if (msg.sender != request.collector) revert NotCollector();
        if (request.clientSeedRevealed || clientSeed == bytes32(0)) revert InvalidSeed();
        if (keccak256(abi.encodePacked(clientSeed)) != request.clientSeedCommitment) {
            revert InvalidSeed();
        }

        request.clientSeed = clientSeed;
        request.clientSeedRevealed = true;
        emit ClientSeedRevealed(requestId);
    }

    function fulfillPull(
        uint64 requestId,
        bytes32 serverSeed,
        bytes32 inventoryId,
        bytes32[] calldata proof
    ) external onlyOwner {
        PullRequest storage request = _getPull(requestId);
        Batch storage batch = _getBatch(request.batchId);
        if (batch.pendingRequestId != requestId) revert NoPendingRequest();
        if (!request.clientSeedRevealed) revert SeedNotRevealed();
        if (keccak256(abi.encodePacked(serverSeed)) != batch.serverSeedCommitment) {
            revert InvalidSeed();
        }

        (uint32 position, uint32 inventoryIndex) = _previewDraw(batch, request, requestId, serverSeed);
        bytes32 leaf = keccak256(abi.encode(request.batchId, inventoryIndex, inventoryId));
        if (!_verifyProof(proof, batch.inventoryRoot, leaf)) revert InvalidInventoryProof();

        _removeInventoryIndex(batch, position);
        request.inventoryIndex = inventoryIndex;
        request.inventoryId = inventoryId;
        request.fulfilled = true;
        batch.pendingRequestId = 0;

        emit PullFulfilled(
            requestId,
            request.batchId,
            request.collector,
            inventoryId,
            inventoryIndex,
            batch.remaining
        );
    }

    function previewDraw(bytes32 batchId, uint64 requestId, bytes32 serverSeed)
        external
        view
        returns (uint32 position, uint32 inventoryIndex)
    {
        PullRequest storage request = _getPull(requestId);
        if (request.batchId != batchId) revert PullNotFound();
        Batch storage batch = _getBatch(batchId);
        if (!request.clientSeedRevealed) revert SeedNotRevealed();
        if (keccak256(abi.encodePacked(serverSeed)) != batch.serverSeedCommitment) {
            revert InvalidSeed();
        }
        return _previewDraw(batch, request, requestId, serverSeed);
    }

    function getBatch(bytes32 batchId)
        external
        view
        returns (
            uint32 totalSupply,
            uint32 remaining,
            uint256 priceWei,
            bytes32 inventoryRoot,
            bytes32 oddsCommitment,
            bytes32 serverSeedCommitment,
            uint64 pendingRequestId
        )
    {
        Batch storage batch = _getBatch(batchId);
        return (
            batch.totalSupply,
            batch.remaining,
            batch.priceWei,
            batch.inventoryRoot,
            batch.oddsCommitment,
            batch.serverSeedCommitment,
            batch.pendingRequestId
        );
    }

    function getPull(uint64 requestId)
        external
        view
        returns (
            address collector,
            bytes32 batchId,
            bytes32 inventoryId,
            uint32 inventoryIndex,
            bool fulfilled
        )
    {
        PullRequest storage request = _getPull(requestId);
        return (
            request.collector,
            request.batchId,
            request.inventoryId,
            request.inventoryIndex,
            request.fulfilled
        );
    }

    function _getBatch(bytes32 batchId) private view returns (Batch storage batch) {
        if (!committedBatches[batchId]) revert BatchNotFound();
        return batches[batchId];
    }

    function _getPull(uint64 requestId) private view returns (PullRequest storage request) {
        request = pullRequests[requestId];
        if (request.collector == address(0)) revert PullNotFound();
    }

    function _previewDraw(Batch storage batch, PullRequest storage request, uint64 requestId, bytes32 serverSeed)
        private
        view
        returns (uint32 position, uint32 inventoryIndex)
    {
        position = uint32(uint256(keccak256(abi.encode(serverSeed, request.clientSeed, requestId))) % batch.remaining);
        uint32 storedIndex = batch.indexSwaps[position];
        inventoryIndex = storedIndex == 0 ? position : storedIndex - 1;
    }

    function _removeInventoryIndex(Batch storage batch, uint32 position) private {
        uint32 lastPosition = batch.remaining - 1;
        uint32 storedLastIndex = batch.indexSwaps[lastPosition];
        uint32 lastInventoryIndex = storedLastIndex == 0 ? lastPosition : storedLastIndex - 1;

        if (position != lastPosition) batch.indexSwaps[position] = lastInventoryIndex + 1;
        delete batch.indexSwaps[lastPosition];
        batch.remaining = lastPosition;
    }

    function _verifyProof(bytes32[] calldata proof, bytes32 root, bytes32 leaf) private pure returns (bool) {
        bytes32 computedHash = leaf;
        for (uint256 index = 0; index < proof.length; index++) {
            bytes32 proofElement = proof[index];
            computedHash = computedHash < proofElement
                ? keccak256(abi.encodePacked(computedHash, proofElement))
                : keccak256(abi.encodePacked(proofElement, computedHash));
        }
        return computedHash == root;
    }
}
