// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IrukaPackBatch} from "../src/IrukaPackBatch.sol";

interface Vm {
    function envAddress(string calldata name) external returns (address value);
    function startBroadcast() external;
    function stopBroadcast() external;
}

contract DeployIrukaPackBatch {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (IrukaPackBatch packBatch) {
        address operator = vm.envAddress("IRUKA_KEEPER_ADDRESS");

        vm.startBroadcast();
        packBatch = new IrukaPackBatch();
        packBatch.setOperator(operator);
        vm.stopBroadcast();
    }
}
