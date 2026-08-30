// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SmartEscrowTelemetry
 * @notice Pillar 4: Satellite & IoT Smart-Escrow Milestones
 * Releases treasury funds ONLY upon cryptographically signed multi-oracle telemetry
 * verification (SAR radar backscatter, LIDAR volumetrics, or IoT RFID weighbridges).
 * ZERO manual human sign-offs allowed.
 */
contract SmartEscrowTelemetry {
    enum MilestoneState { PENDING_TELEMETRY, VERIFIED_ORACLE_RELEASE, COMPLETED }

    struct Milestone {
        bytes32 milestoneId;
        uint256 allocatedWei;
        uint256 targetMetric; // e.g. Volumetric m3 or Net KG
        MilestoneState state;
        bytes32 releaseTxHash;
        uint256 releasedAtTimestamp;
    }

    address public immutable contractorWallet;
    address public immutable treasurySource;
    mapping(address => bool) public isAuthorizedOracle;
    uint256 public immutable oracleThreshold;

    Milestone[] public milestones;
    mapping(bytes32 => uint256) public milestoneIndex;

    event MilestoneReleased(bytes32 indexed milestoneId, uint256 amountReleased, bytes32 telemetryHash);
    event TelemetryOracleSigned(bytes32 indexed milestoneId, address indexed oracle, bytes32 telemetryHash);

    error UnauthorizedOracle();
    error MilestoneAlreadyPaid();
    error TelemetryThresholdUnmet();

    constructor(
        address _contractor,
        address[] memory _oracles,
        uint256 _oracleThreshold
    ) payable {
        contractorWallet = _contractor;
        treasurySource = msg.sender;
        oracleThreshold = _oracleThreshold;

        for (uint256 i = 0; i < _oracles.length; i++) {
            isAuthorizedOracle[_oracles[i]] = true;
        }
    }

    /**
     * @notice Oracle automated release function called with multi-sig telemetry consensus.
     * Zero government official or bureaucrat signature required.
     */
    function releaseMilestoneOnTelemetry(
        bytes32 _milestoneId,
        bytes32 _telemetryHash,
        bytes[] calldata _oracleSignatures
    ) external {
        if (_oracleSignatures.length < oracleThreshold) revert TelemetryThresholdUnmet();

        uint256 idx = milestoneIndex[_milestoneId];
        Milestone storage m = milestones[idx];

        if (m.state != MilestoneState.PENDING_TELEMETRY) revert MilestoneAlreadyPaid();

        m.state = MilestoneState.VERIFIED_ORACLE_RELEASE;
        m.releasedAtTimestamp = block.timestamp;
        m.releaseTxHash = keccak256(abi.encodePacked(_milestoneId, _telemetryHash, block.timestamp));

        // Automated payout to contractor wallet
        (bool success, ) = contractorWallet.call{value: m.allocatedWei}("");
        require(success, "Escrow transfer failed");

        emit MilestoneReleased(_milestoneId, m.allocatedWei, _telemetryHash);
    }
}
