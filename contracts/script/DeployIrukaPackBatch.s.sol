// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IrukaPackBatch } from "../src/IrukaPackBatch.sol";

interface Vm {
    function startBroadcast() external;
    function stopBroadcast() external;
}

contract DeployIrukaPackBatch {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (IrukaPackBatch packBatch) {
        vm.startBroadcast();
        packBatch = new IrukaPackBatch();
        vm.stopBroadcast();
    }
}
