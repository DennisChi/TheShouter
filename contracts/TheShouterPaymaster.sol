// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "@opengsn/contracts/src/BasePaymaster.sol";

contract SingleRecipientPaymaster is BasePaymaster {
    address public target;

    constructor(address _target) {
        target = _target;
    }

    function versionPaymaster()
        external
        view
        virtual
        override
        returns (string memory)
    {
        return "2.2.0+opengsn.recipient.ipaymaster";
    }

    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    )
        external
        virtual
        override
        returns (bytes memory context, bool revertOnRecipientRevert)
    {
        (relayRequest, signature, approvalData, maxPossibleGas);
        require(relayRequest.request.to == target, "wrong target");
        return ("", true);
    }

    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external virtual override {
        (context, success, gasUseWithoutPost, relayData);
    }
}
