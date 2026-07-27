// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IrukaPackBatch} from "../src/IrukaPackBatch.sol";

interface ConcurrentVm {
    function deal(address account, uint256 newBalance) external;
    function prank(address caller) external;
}

contract IrukaPackBatchConcurrentTest {
    ConcurrentVm private constant vm = ConcurrentVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address private constant FIRST_COLLECTOR = address(0xA11CE);
    address private constant SECOND_COLLECTOR = address(0xB0B);
    bytes32 private constant BATCH_ID = keccak256("IRUKA-GIRL-DEBUT-001");
    bytes32 private constant FIRST_CLIENT_SEED = keccak256("first client seed");
    bytes32 private constant SECOND_CLIENT_SEED = keccak256("second client seed");
    bytes32 private constant FIRST_SERVER_SEED = keccak256("first server seed");
    bytes32 private constant SECOND_SERVER_SEED = keccak256("second server seed");
    bytes32 private constant INVENTORY_A = keccak256("IRK-DEBUT-0001");
    bytes32 private constant INVENTORY_B = keccak256("IRK-DEBUT-0002");
    uint256 private constant PACK_PRICE = 0.001 ether;

    IrukaPackBatch private packBatch;

    function setUp() public {
        packBatch = new IrukaPackBatch();
        vm.deal(FIRST_COLLECTOR, 1 ether);
        vm.deal(SECOND_COLLECTOR, 1 ether);
        packBatch.commitBatch(BATCH_ID, 2, PACK_PRICE, _inventoryRoot(), keccak256("odds snapshot"), _drawSeedRoot());
    }

    function testConcurrentRequestsReserveDistinctDraws() public {
        (uint64 firstRequestId, uint64 secondRequestId) = _requestBothPulls();

        (, uint32 available, uint32 remaining,,,,, uint32 nextDrawIndex, uint32 nextFulfillIndex) =
            packBatch.getBatch(BATCH_ID);
        (,,, uint32 firstDrawIndex,,,) = packBatch.getPull(firstRequestId);
        (,,, uint32 secondDrawIndex,,,) = packBatch.getPull(secondRequestId);

        _assertEqual(available, 0);
        _assertEqual(remaining, 2);
        _assertEqual(nextDrawIndex, 2);
        _assertEqual(nextFulfillIndex, 0);
        _assertEqual(firstDrawIndex, 0);
        _assertEqual(secondDrawIndex, 1);

        vm.prank(FIRST_COLLECTOR);
        (bool succeeded,) = address(packBatch).call{value: PACK_PRICE}(
            abi.encodeCall(packBatch.requestPull, (BATCH_ID, keccak256("third client seed")))
        );
        _assertTrue(!succeeded);
    }

    function testFulfillmentRequiresDrawOrder() public {
        (, uint64 secondRequestId) = _requestBothPulls();
        bytes32[] memory inventoryProof = _inventoryProof(0);

        (bool succeeded,) = address(packBatch)
            .call(
                abi.encodeCall(
                    packBatch.fulfillPull,
                    (secondRequestId, SECOND_SERVER_SEED, _drawSeedProof(1), INVENTORY_A, inventoryProof)
                )
            );

        _assertTrue(!succeeded);
    }

    function testServerSeedMustMatchCommittedDraw() public {
        (uint64 firstRequestId,) = _requestBothPulls();

        (bool succeeded,) = address(packBatch)
            .call(
                abi.encodeCall(
                    packBatch.fulfillPull,
                    (firstRequestId, SECOND_SERVER_SEED, _drawSeedProof(0), INVENTORY_A, _inventoryProof(0))
                )
            );

        _assertTrue(!succeeded);
    }

    function testConcurrentPullsConsumeInventoryWithoutReplacement() public {
        (uint64 firstRequestId, uint64 secondRequestId) = _requestBothPulls();
        uint32 firstInventoryIndex = _initialInventoryIndex(FIRST_SERVER_SEED, FIRST_CLIENT_SEED, firstRequestId);
        uint32 secondInventoryIndex = firstInventoryIndex == 0 ? 1 : 0;

        _fulfill(firstRequestId, FIRST_SERVER_SEED, 0, firstInventoryIndex);
        _fulfill(secondRequestId, SECOND_SERVER_SEED, 1, secondInventoryIndex);

        (, uint32 available, uint32 remaining,,,,,, uint32 nextFulfillIndex) = packBatch.getBatch(BATCH_ID);
        (,,,, bytes32 firstInventoryId,, bool firstFulfilled) = packBatch.getPull(firstRequestId);
        (,,,, bytes32 secondInventoryId,, bool secondFulfilled) = packBatch.getPull(secondRequestId);

        _assertEqual(available, 0);
        _assertEqual(remaining, 0);
        _assertEqual(nextFulfillIndex, 2);
        _assertTrue(firstFulfilled);
        _assertTrue(secondFulfilled);
        _assertTrue(firstInventoryId != secondInventoryId);
    }

    function _requestBothPulls() private returns (uint64 firstRequestId, uint64 secondRequestId) {
        vm.prank(FIRST_COLLECTOR);
        firstRequestId = packBatch.requestPull{value: PACK_PRICE}(BATCH_ID, FIRST_CLIENT_SEED);

        vm.prank(SECOND_COLLECTOR);
        secondRequestId = packBatch.requestPull{value: PACK_PRICE}(BATCH_ID, SECOND_CLIENT_SEED);
    }

    function _fulfill(uint64 requestId, bytes32 serverSeed, uint32 drawIndex, uint32 inventoryIndex) private {
        packBatch.fulfillPull(
            requestId,
            serverSeed,
            _drawSeedProof(drawIndex),
            _inventoryId(inventoryIndex),
            _inventoryProof(inventoryIndex)
        );
    }

    function _initialInventoryIndex(bytes32 serverSeed, bytes32 clientSeed, uint64 requestId)
        private
        pure
        returns (uint32)
    {
        return uint32(uint256(keccak256(abi.encode(serverSeed, clientSeed, requestId))) % 2);
    }

    function _inventoryRoot() private pure returns (bytes32) {
        return _hashPair(_inventoryLeaf(0), _inventoryLeaf(1));
    }

    function _inventoryProof(uint32 inventoryIndex) private pure returns (bytes32[] memory proof) {
        proof = new bytes32[](1);
        proof[0] = _inventoryLeaf(inventoryIndex == 0 ? 1 : 0);
    }

    function _inventoryLeaf(uint32 inventoryIndex) private pure returns (bytes32) {
        return keccak256(abi.encode(BATCH_ID, inventoryIndex, _inventoryId(inventoryIndex)));
    }

    function _inventoryId(uint32 inventoryIndex) private pure returns (bytes32) {
        return inventoryIndex == 0 ? INVENTORY_A : INVENTORY_B;
    }

    function _drawSeedRoot() private pure returns (bytes32) {
        return _hashPair(_drawSeedLeaf(0), _drawSeedLeaf(1));
    }

    function _drawSeedProof(uint32 drawIndex) private pure returns (bytes32[] memory proof) {
        proof = new bytes32[](1);
        proof[0] = _drawSeedLeaf(drawIndex == 0 ? 1 : 0);
    }

    function _drawSeedLeaf(uint32 drawIndex) private pure returns (bytes32) {
        bytes32 serverSeed = drawIndex == 0 ? FIRST_SERVER_SEED : SECOND_SERVER_SEED;
        return keccak256(abi.encode(BATCH_ID, drawIndex, serverSeed));
    }

    function _hashPair(bytes32 left, bytes32 right) private pure returns (bytes32) {
        return left < right ? keccak256(abi.encodePacked(left, right)) : keccak256(abi.encodePacked(right, left));
    }

    function _assertEqual(uint256 actual, uint256 expected) private pure {
        require(actual == expected, "uint values differ");
    }

    function _assertTrue(bool condition) private pure {
        require(condition, "assertion failed");
    }
}
