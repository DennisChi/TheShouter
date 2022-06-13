// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@opengsn/contracts/src/BaseRelayRecipient.sol";

contract TheShouter is ERC721URIStorage, BaseRelayRecipient {
    using Counters for Counters.Counter;

    struct Board {
        address creator;
        bytes[] comments;
        address[] committers;
        mapping(address => bool) committed;
    }

    Counters.Counter private tokenIds;
    mapping(uint256 => Board) private boards;
    string public override versionRecipient = "2.2.0";

    uint256 constant chargeLowerLimit = 1000000 gwei;
    uint256 constant commentHigherLimit = 144;

    event RentBoard(address indexed renter, string uri);
    event CommitComment(address indexed committer, bytes content);

    constructor(address forwarder) ERC721("TheShouter", "SBB") {
        _setTrustedForwarder(forwarder);
    }

    function rentBoard(string calldata _uri) external payable {
        require(
            msg.value >= chargeLowerLimit,
            string(abi.encodePacked("At least ", chargeLowerLimit, " wei"))
        );
        require(
            chargeLowerLimit > this.balance() - msg.value,
            "It's not rentable now."
        );

        tokenIds.increment();
        uint256 tokenId = tokenIds.current();

        _mint(_msgSender(), tokenId);
        _setTokenURI(tokenId, _uri);

        Board storage board = boards[tokenId];
        board.creator = _msgSender();

        emit RentBoard(_msgSender(), _uri);
    }

    function commitComment(bytes calldata _comment) external {
        require(this.balance() > chargeLowerLimit, "Not enough balance");
        require(
            _comment.length <= commentHigherLimit,
            string(abi.encodePacked("At most ", commentHigherLimit, " byte."))
        );

        uint256 tokenId = tokenIds.current();
        Board storage board = boards[tokenId];
        require(!board.committed[_msgSender()], "Alreay committed");

        board.comments.push(_comment);
        board.committed[_msgSender()] = true;
        board.committers.push(_msgSender());

        emit CommitComment(_msgSender(), _comment);
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    function interactable() external view returns (bool) {
        return this.balance() <= chargeLowerLimit;
    }

    function maxBoardIndex() external view returns (uint256) {
        return tokenIds.current();
    }

    function commentsLength(uint256 _tokenId) external view returns (uint256) {
        require(
            _tokenId > 0 && _tokenId <= tokenIds.current(),
            "invalid input"
        );
        return boards[_tokenId].comments.length;
    }

    function queryComments(uint256 _tokenId)
        external
        view
        returns (bytes[] memory)
    {
        require(
            _tokenId > 0 && _tokenId <= tokenIds.current(),
            "invalid input"
        );
        Board storage board = boards[_tokenId];
        return board.comments;
    }

    function queryCommitters(uint256 _tokenId)
        external
        view
        returns (address[] memory)
    {
        require(
            _tokenId > 0 && _tokenId <= tokenIds.current(),
            "invalid input"
        );
        Board storage board = boards[_tokenId];
        return board.committers;
    }

    function _msgSender()
        internal
        view
        virtual
        override(Context, BaseRelayRecipient)
        returns (address ret)
    {
        if (msg.data.length >= 20 && isTrustedForwarder(msg.sender)) {
            assembly {
                ret := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            ret = msg.sender;
        }
    }

    function _msgData()
        internal
        view
        virtual
        override(Context, BaseRelayRecipient)
        returns (bytes calldata ret)
    {
        if (msg.data.length >= 20 && isTrustedForwarder(msg.sender)) {
            return msg.data[0:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }
}
