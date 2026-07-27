// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Testnet batch commitments and auditable, without-replacement pull receipts.
contract IrukaPackBatch {
    error BatchAlreadyExists();
    error BatchNotFound();
    error IncorrectPayment();
    error InvalidInventoryProof();
    error InvalidOperator();
    error InvalidSeed();
    error InvalidSeedProof();
    error InvalidSupply();
    error NotOperator();
    error NotOwner();
    error PullAlreadyFulfilled();
    error PullNotFound();
    error PullOutOfOrder();
    error TransferFailed();

    struct Batch {
        uint32 totalSupply;
        uint32 available;
        uint32 remaining;
        uint32 nextDrawIndex;
        uint32 nextFulfillIndex;
        uint256 priceWei;
        bytes32 inventoryRoot;
        bytes32 oddsCommitment;
        bytes32 drawSeedRoot;
        mapping(uint32 => uint32) indexSwaps;
    }

    struct PullRequest {
        address collector;
        bytes32 batchId;
        bytes32 clientSeed;
        bytes32 inventoryId;
        uint32 drawIndex;
        uint32 inventoryIndex;
        bool fulfilled;
    }

    address public immutable owner;
    address public operator;
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
        bytes32 drawSeedRoot
    );
    event PullRequested(uint64 indexed requestId, bytes32 indexed batchId, address indexed collector, uint32 drawIndex);
    event PullFulfilled(
        uint64 indexed requestId,
        bytes32 indexed batchId,
        address indexed collector,
        bytes32 inventoryId,
        uint32 inventoryIndex,
        uint32 remaining
    );
    event OperatorUpdated(address indexed previousOperator, address indexed newOperator);
    event TestPaymentsWithdrawn(address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    constructor() {
        owner = msg.sender;
        operator = msg.sender;
    }

    function commitBatch(
        bytes32 batchId,
        uint32 totalSupply,
        uint256 priceWei,
        bytes32 inventoryRoot,
        bytes32 oddsCommitment,
        bytes32 drawSeedRoot
    ) external onlyOwner {
        if (committedBatches[batchId]) revert BatchAlreadyExists();
        if (
            totalSupply == 0 || inventoryRoot == bytes32(0) || oddsCommitment == bytes32(0)
                || drawSeedRoot == bytes32(0)
        ) revert InvalidSupply();

        Batch storage batch = batches[batchId];
        batch.totalSupply = totalSupply;
        batch.available = totalSupply;
        batch.remaining = totalSupply;
        batch.priceWei = priceWei;
        batch.inventoryRoot = inventoryRoot;
        batch.oddsCommitment = oddsCommitment;
        batch.drawSeedRoot = drawSeedRoot;
        committedBatches[batchId] = true;

        emit BatchCommitted(batchId, totalSupply, priceWei, inventoryRoot, oddsCommitment, drawSeedRoot);
    }

    function requestPull(bytes32 batchId, bytes32 clientSeed) external payable returns (uint64 requestId) {
        Batch storage batch = _getBatch(batchId);
        if (batch.available == 0) revert InvalidSupply();
        if (msg.value != batch.priceWei) revert IncorrectPayment();
        if (clientSeed == bytes32(0)) revert InvalidSeed();

        requestId = ++nextRequestId;
        uint32 drawIndex = batch.nextDrawIndex;
        batch.nextDrawIndex = drawIndex + 1;
        batch.available -= 1;
        pullRequests[requestId] = PullRequest({
            collector: msg.sender,
            batchId: batchId,
            clientSeed: clientSeed,
            inventoryId: bytes32(0),
            drawIndex: drawIndex,
            inventoryIndex: 0,
            fulfilled: false
        });

        emit PullRequested(requestId, batchId, msg.sender, drawIndex);
    }

    function withdraw(address payable recipient) external onlyOwner {
        if (recipient == address(0)) revert TransferFailed();

        uint256 amount = address(this).balance;
        (bool transferred,) = recipient.call{value: amount}("");
        if (!transferred) revert TransferFailed();

        emit TestPaymentsWithdrawn(recipient, amount);
    }

    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert InvalidOperator();

        address previousOperator = operator;
        operator = newOperator;
        emit OperatorUpdated(previousOperator, newOperator);
    }

    function fulfillPull(
        uint64 requestId,
        bytes32 serverSeed,
        bytes32[] calldata seedProof,
        bytes32 inventoryId,
        bytes32[] calldata inventoryProof
    ) external onlyOperator {
        PullRequest storage request = _getPull(requestId);
        if (request.fulfilled) revert PullAlreadyFulfilled();

        Batch storage batch = _getBatch(request.batchId);
        if (request.drawIndex != batch.nextFulfillIndex) revert PullOutOfOrder();
        if (!_verifyDrawSeed(batch, request, serverSeed, seedProof)) {
            revert InvalidSeedProof();
        }

        (uint32 position, uint32 inventoryIndex) = _previewDraw(batch, request, requestId, serverSeed);
        bytes32 inventoryLeaf = keccak256(abi.encode(request.batchId, inventoryIndex, inventoryId));
        if (!_verifyProof(inventoryProof, batch.inventoryRoot, inventoryLeaf)) {
            revert InvalidInventoryProof();
        }

        _removeInventoryIndex(batch, position);
        request.inventoryIndex = inventoryIndex;
        request.inventoryId = inventoryId;
        request.fulfilled = true;
        batch.nextFulfillIndex += 1;

        emit PullFulfilled(requestId, request.batchId, request.collector, inventoryId, inventoryIndex, batch.remaining);
    }

    function previewDraw(bytes32 batchId, uint64 requestId, bytes32 serverSeed, bytes32[] calldata seedProof)
        external
        view
        returns (uint32 position, uint32 inventoryIndex)
    {
        PullRequest storage request = _getPull(requestId);
        if (request.batchId != batchId) revert PullNotFound();

        Batch storage batch = _getBatch(batchId);
        if (!_verifyDrawSeed(batch, request, serverSeed, seedProof)) {
            revert InvalidSeedProof();
        }
        return _previewDraw(batch, request, requestId, serverSeed);
    }

    function getBatch(bytes32 batchId)
        external
        view
        returns (
            uint32 totalSupply,
            uint32 available,
            uint32 remaining,
            uint256 priceWei,
            bytes32 inventoryRoot,
            bytes32 oddsCommitment,
            bytes32 drawSeedRoot,
            uint32 nextDrawIndex,
            uint32 nextFulfillIndex
        )
    {
        Batch storage batch = _getBatch(batchId);
        return (
            batch.totalSupply,
            batch.available,
            batch.remaining,
            batch.priceWei,
            batch.inventoryRoot,
            batch.oddsCommitment,
            batch.drawSeedRoot,
            batch.nextDrawIndex,
            batch.nextFulfillIndex
        );
    }

    function getPull(uint64 requestId)
        external
        view
        returns (
            address collector,
            bytes32 batchId,
            bytes32 clientSeed,
            uint32 drawIndex,
            bytes32 inventoryId,
            uint32 inventoryIndex,
            bool fulfilled
        )
    {
        PullRequest storage request = _getPull(requestId);
        return (
            request.collector,
            request.batchId,
            request.clientSeed,
            request.drawIndex,
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

    function _verifyDrawSeed(
        Batch storage batch,
        PullRequest storage request,
        bytes32 serverSeed,
        bytes32[] calldata seedProof
    ) private view returns (bool) {
        if (serverSeed == bytes32(0)) return false;
        bytes32 seedLeaf = keccak256(abi.encode(request.batchId, request.drawIndex, serverSeed));
        return _verifyProof(seedProof, batch.drawSeedRoot, seedLeaf);
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

        if (position != lastPosition) {
            batch.indexSwaps[position] = lastInventoryIndex + 1;
        }
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
