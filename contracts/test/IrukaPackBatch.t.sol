// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IrukaPackBatch } from "../src/IrukaPackBatch.sol";

interface Vm {
    function deal(address account, uint256 newBalance) external;
    function prank(address caller) external;
}

contract IrukaPackBatchTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address private constant COLLECTOR = address(0xC011EC70);
    bytes32 private constant BATCH_ID = keccak256("IRUKA-GIRL-DEBUT-001");
    bytes32 private constant SERVER_SEED = keccak256("server seed");
    bytes32 private constant FIRST_CLIENT_SEED = keccak256("first client seed");
    bytes32 private constant SECOND_CLIENT_SEED = keccak256("second client seed");
    bytes32 private constant INVENTORY_A = keccak256("IRK-DEBUT-0001");
    bytes32 private constant INVENTORY_B = keccak256("IRK-DEBUT-0002");
    bytes32 private constant FOUR_CARD_BATCH_ID = keccak256("IRUKA-GIRL-STAGE-001");
    bytes32 private constant INVENTORY_C = keccak256("IRK-STAGE-0003");
    bytes32 private constant INVENTORY_D = keccak256("IRK-STAGE-0004");
    uint256 private constant PACK_PRICE = 0.001 ether;

    IrukaPackBatch private packBatch;

    function setUp() public {
        packBatch = new IrukaPackBatch();
        vm.deal(COLLECTOR, 1 ether);
        packBatch.commitBatch(
            BATCH_ID,
            2,
            PACK_PRICE,
            _root(),
            keccak256("odds snapshot"),
            keccak256(abi.encodePacked(SERVER_SEED))
        );
    }

    function testCommitPublishesBatchEvidence() public view {
        (
            uint32 total,
            uint32 remaining,
            uint256 priceWei,
            bytes32 inventoryRoot,
            bytes32 oddsCommitment,
            bytes32 seedCommitment,
            uint64 pendingRequestId
        ) = packBatch.getBatch(BATCH_ID);

        _assertEqual(total, 2);
        _assertEqual(remaining, 2);
        _assertEqual(priceWei, PACK_PRICE);
        _assertEqual(inventoryRoot, _root());
        _assertEqual(oddsCommitment, keccak256("odds snapshot"));
        _assertEqual(seedCommitment, keccak256(abi.encodePacked(SERVER_SEED)));
        _assertEqual(pendingRequestId, 0);
    }

    function testPullAssignsCommittedInventoryWithoutReplacement() public {
        bytes32 firstInventory = _requestAndFulfill(FIRST_CLIENT_SEED);
        bytes32 secondInventory = _requestAndFulfill(SECOND_CLIENT_SEED);

        (, uint32 remaining,,,,,) = packBatch.getBatch(BATCH_ID);
        _assertEqual(remaining, 0);
        _assertTrue(firstInventory != secondInventory);
    }

    function testPullRequiresThePublishedPrice() public {
        vm.prank(COLLECTOR);
        (bool succeeded,) = address(packBatch).call(
            abi.encodeCall(
                packBatch.requestPull,
                (BATCH_ID, keccak256(abi.encodePacked(FIRST_CLIENT_SEED)))
            )
        );

        _assertTrue(!succeeded);
    }

    function testSelectionDoesNotRepeatAfterMultipleIndexSwaps() public {
        packBatch.commitBatch(
            FOUR_CARD_BATCH_ID,
            4,
            PACK_PRICE,
            _fourCardRoot(),
            keccak256("stage odds snapshot"),
            keccak256(abi.encodePacked(SERVER_SEED))
        );

        uint64 firstRequestId = _requestPull(FOUR_CARD_BATCH_ID, 1, 4, 0);
        _revealAndFulfillFourCardPull(firstRequestId, _findClientSeed(1, 4, 0));

        uint64 secondRequestId = _requestPull(FOUR_CARD_BATCH_ID, 2, 3, 0);
        _revealAndFulfillFourCardPull(secondRequestId, _findClientSeed(2, 3, 0));

        uint64 thirdRequestId = _requestPull(FOUR_CARD_BATCH_ID, 3, 2, 0);
        vm.prank(COLLECTOR);
        packBatch.revealClientSeed(thirdRequestId, _findClientSeed(3, 2, 0));

        (, uint32 thirdInventoryIndex) = packBatch.previewDraw(
            FOUR_CARD_BATCH_ID,
            thirdRequestId,
            SERVER_SEED
        );
        _assertEqual(thirdInventoryIndex, 2);
    }

    function _requestAndFulfill(bytes32 clientSeed) private returns (bytes32 inventoryId) {
        vm.prank(COLLECTOR);
        uint64 requestId = packBatch.requestPull{ value: PACK_PRICE }(
            BATCH_ID,
            keccak256(abi.encodePacked(clientSeed))
        );

        vm.prank(COLLECTOR);
        packBatch.revealClientSeed(requestId, clientSeed);

        (, uint32 inventoryIndex) = packBatch.previewDraw(BATCH_ID, requestId, SERVER_SEED);
        inventoryId = inventoryIndex == 0 ? INVENTORY_A : INVENTORY_B;
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = inventoryIndex == 0 ? _leaf(1, INVENTORY_B) : _leaf(0, INVENTORY_A);

        packBatch.fulfillPull(requestId, SERVER_SEED, inventoryId, proof);

        (
            address collector,
            bytes32 pullBatchId,
            bytes32 assignedInventoryId,
            uint32 assignedInventoryIndex,
            bool fulfilled
        ) = packBatch.getPull(requestId);
        _assertEqual(collector, COLLECTOR);
        _assertEqual(pullBatchId, BATCH_ID);
        _assertEqual(assignedInventoryId, inventoryId);
        _assertEqual(assignedInventoryIndex, inventoryIndex);
        _assertTrue(fulfilled);
    }

    function _requestPull(bytes32 batchId, uint64 requestId, uint32 modulo, uint32 target)
        private
        returns (uint64 actualRequestId)
    {
        bytes32 clientSeed = _findClientSeed(requestId, modulo, target);
        vm.prank(COLLECTOR);
        actualRequestId = packBatch.requestPull{ value: PACK_PRICE }(
            batchId,
            keccak256(abi.encodePacked(clientSeed))
        );
        _assertEqual(actualRequestId, requestId);
    }

    function _revealAndFulfillFourCardPull(uint64 requestId, bytes32 clientSeed) private {
        vm.prank(COLLECTOR);
        packBatch.revealClientSeed(requestId, clientSeed);

        (, uint32 inventoryIndex) = packBatch.previewDraw(
            FOUR_CARD_BATCH_ID,
            requestId,
            SERVER_SEED
        );
        bytes32 inventoryId = _fourCardInventoryId(inventoryIndex);
        packBatch.fulfillPull(
            requestId,
            SERVER_SEED,
            inventoryId,
            _fourCardProof(inventoryIndex)
        );
    }

    function _root() private pure returns (bytes32) {
        return _hashPair(_leaf(0, INVENTORY_A), _leaf(1, INVENTORY_B));
    }

    function _fourCardRoot() private pure returns (bytes32) {
        return _hashPair(
            _hashPair(_fourCardLeaf(0), _fourCardLeaf(1)),
            _hashPair(_fourCardLeaf(2), _fourCardLeaf(3))
        );
    }

    function _fourCardLeaf(uint32 inventoryIndex) private pure returns (bytes32) {
        return keccak256(
            abi.encode(FOUR_CARD_BATCH_ID, inventoryIndex, _fourCardInventoryId(inventoryIndex))
        );
    }

    function _fourCardInventoryId(uint32 inventoryIndex) private pure returns (bytes32) {
        if (inventoryIndex == 0) return INVENTORY_A;
        if (inventoryIndex == 1) return INVENTORY_B;
        if (inventoryIndex == 2) return INVENTORY_C;
        return INVENTORY_D;
    }

    function _fourCardProof(uint32 inventoryIndex) private pure returns (bytes32[] memory proof) {
        proof = new bytes32[](2);
        if (inventoryIndex == 0) {
            proof[0] = _fourCardLeaf(1);
            proof[1] = _hashPair(_fourCardLeaf(2), _fourCardLeaf(3));
        } else if (inventoryIndex == 1) {
            proof[0] = _fourCardLeaf(0);
            proof[1] = _hashPair(_fourCardLeaf(2), _fourCardLeaf(3));
        } else if (inventoryIndex == 2) {
            proof[0] = _fourCardLeaf(3);
            proof[1] = _hashPair(_fourCardLeaf(0), _fourCardLeaf(1));
        } else {
            proof[0] = _fourCardLeaf(2);
            proof[1] = _hashPair(_fourCardLeaf(0), _fourCardLeaf(1));
        }
    }

    function _findClientSeed(uint64 requestId, uint32 modulo, uint32 target)
        private
        pure
        returns (bytes32)
    {
        for (uint256 nonce = 1; nonce < 1000; nonce++) {
            bytes32 candidate = keccak256(abi.encode(requestId, nonce));
            if (uint256(keccak256(abi.encode(SERVER_SEED, candidate, requestId))) % modulo == target) {
                return candidate;
            }
        }
        revert("seed not found");
    }

    function _leaf(uint32 inventoryIndex, bytes32 inventoryId) private pure returns (bytes32) {
        return keccak256(abi.encode(BATCH_ID, inventoryIndex, inventoryId));
    }

    function _hashPair(bytes32 left, bytes32 right) private pure returns (bytes32) {
        return left < right
            ? keccak256(abi.encodePacked(left, right))
            : keccak256(abi.encodePacked(right, left));
    }

    function _assertEqual(uint256 actual, uint256 expected) private pure {
        require(actual == expected, "uint values differ");
    }

    function _assertEqual(bytes32 actual, bytes32 expected) private pure {
        require(actual == expected, "bytes32 values differ");
    }

    function _assertEqual(address actual, address expected) private pure {
        require(actual == expected, "addresses differ");
    }

    function _assertTrue(bool condition) private pure {
        require(condition, "assertion failed");
    }
}
