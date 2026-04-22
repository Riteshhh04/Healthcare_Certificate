// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HealthCertificate
 * @dev Smart contract for storing and verifying healthcare certificates on Ethereum blockchain
 * @author Healthcare Certificate Verification System
 */
contract HealthCertificate {
    
    // Structure to store certificate data
    struct Certificate {
        string certificateId;      // Unique ID from the application
        string patientId;          // Hashed patient identifier
        string certificateType;    // Type of certificate
        string issuedBy;           // Issuing institution
        uint256 issueDate;         // Unix timestamp of issue date
        uint256 timestamp;         // Blockchain timestamp when stored
        bool exists;               // To check if certificate exists
        bool revoked;              // To track if certificate has been revoked
    }
    
    // Mapping from certificate hash to Certificate struct
    mapping(bytes32 => Certificate) private certificates;
    
    // Array to store all certificate hashes for enumeration
    bytes32[] private certificateHashes;
    
    // Mapping from patient ID to their certificate hashes
    mapping(string => bytes32[]) private patientCertificates;
    
    // Contract owner (admin)
    address public owner;
    
    // Authorized issuers (hospitals, clinics)
    mapping(address => bool) public authorizedIssuers;
    
    // Events
    event CertificateStored(
        bytes32 indexed certificateHash,
        string certificateId,
        string patientId,
        string certificateType,
        string issuedBy,
        uint256 issueDate,
        uint256 timestamp
    );
    
    event CertificateRevoked(
        bytes32 indexed certificateHash,
        uint256 timestamp
    );
    
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedIssuers[msg.sender],
            "Not authorized to issue certificates"
        );
        _;
    }
    
    /**
     * @dev Constructor sets the contract deployer as owner
     */
    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }
    
    /**
     * @dev Authorize a new issuer (hospital/clinic)
     * @param _issuer Address of the issuer to authorize
     */
    function authorizeIssuer(address _issuer) external onlyOwner {
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }
    
    /**
     * @dev Revoke an issuer's authorization
     * @param _issuer Address of the issuer to revoke
     */
    function revokeIssuer(address _issuer) external onlyOwner {
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }
    
    /**
     * @dev Generate a hash for the certificate data
     * @param _certificateId Unique certificate ID
     * @param _patientId Patient identifier
     * @param _certificateType Type of certificate
     * @param _issuedBy Issuing institution
     * @param _issueDate Issue date timestamp
     * @return bytes32 The generated hash
     */
    function generateCertificateHash(
        string memory _certificateId,
        string memory _patientId,
        string memory _certificateType,
        string memory _issuedBy,
        uint256 _issueDate
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                _certificateId,
                _patientId,
                _certificateType,
                _issuedBy,
                _issueDate
            )
        );
    }
    
    /**
     * @dev Store a new certificate on the blockchain
     * @param _certificateId Unique certificate ID
     * @param _patientId Patient identifier
     * @param _certificateType Type of certificate
     * @param _issuedBy Issuing institution
     * @param _issueDate Issue date timestamp
     * @return certificateHash The hash of the stored certificate
     */
    function storeCertificate(
        string memory _certificateId,
        string memory _patientId,
        string memory _certificateType,
        string memory _issuedBy,
        uint256 _issueDate
    ) external onlyAuthorized returns (bytes32 certificateHash) {
        // Generate the certificate hash
        certificateHash = generateCertificateHash(
            _certificateId,
            _patientId,
            _certificateType,
            _issuedBy,
            _issueDate
        );
        
        // Check if certificate already exists
        require(!certificates[certificateHash].exists, "Certificate already exists");
        
        // Store the certificate
        certificates[certificateHash] = Certificate({
            certificateId: _certificateId,
            patientId: _patientId,
            certificateType: _certificateType,
            issuedBy: _issuedBy,
            issueDate: _issueDate,
            timestamp: block.timestamp,
            exists: true,
            revoked: false
        });
        
        // Add to arrays for enumeration
        certificateHashes.push(certificateHash);
        patientCertificates[_patientId].push(certificateHash);
        
        // Emit event
        emit CertificateStored(
            certificateHash,
            _certificateId,
            _patientId,
            _certificateType,
            _issuedBy,
            _issueDate,
            block.timestamp
        );
        
        return certificateHash;
    }
    
    /**
     * @dev Verify if a certificate exists and is valid
     * @param _certificateHash The hash to verify
     * @return isValid Whether the certificate is valid
     * @return certificateType The type of certificate
     * @return issuedBy The issuing institution
     * @return issueDate The issue date
     * @return timestamp The blockchain timestamp
     * @return revoked Whether the certificate has been revoked
     */
    function verifyCertificate(bytes32 _certificateHash) external view returns (
        bool isValid,
        string memory certificateType,
        string memory issuedBy,
        uint256 issueDate,
        uint256 timestamp,
        bool revoked
    ) {
        Certificate memory cert = certificates[_certificateHash];
        
        if (!cert.exists) {
            return (false, "", "", 0, 0, false);
        }
        
        return (
            true,
            cert.certificateType,
            cert.issuedBy,
            cert.issueDate,
            cert.timestamp,
            cert.revoked
        );
    }
    
    /**
 * @dev Get full certificate details
 * @param _certificateHash The hash of the certificate
 * @return certificateId ID of the certificate
 * @return patientId ID of the patient
 * @return certificateType Type of certificate
 * @return issuedBy Issuer of the certificate
 * @return issueDate Date of issue
 * @return timestamp Timestamp of creation
 * @return exists Whether certificate exists
 * @return revoked Whether certificate is revoked
 */
function getCertificate(bytes32 _certificateHash) external view returns (
    string memory certificateId,
    string memory patientId,
    string memory certificateType,
    string memory issuedBy,
    uint256 issueDate,
    uint256 timestamp,
    bool exists,
    bool revoked
) {
    Certificate memory cert = certificates[_certificateHash];
    return (
        cert.certificateId,
        cert.patientId,
        cert.certificateType,
        cert.issuedBy,
        cert.issueDate,
        cert.timestamp,
        cert.exists,
        cert.revoked
    );
}
    
    /**
     * @dev Revoke a certificate
     * @param _certificateHash The hash of the certificate to revoke
     */
    function revokeCertificate(bytes32 _certificateHash) external onlyAuthorized {
        require(certificates[_certificateHash].exists, "Certificate does not exist");
        require(!certificates[_certificateHash].revoked, "Certificate already revoked");
        
        certificates[_certificateHash].revoked = true;
        
        emit CertificateRevoked(_certificateHash, block.timestamp);
    }
    
    /**
     * @dev Get all certificate hashes for a patient
     * @param _patientId The patient identifier
     * @return Array of certificate hashes
     */
    function getPatientCertificates(string memory _patientId) external view returns (bytes32[] memory) {
        return patientCertificates[_patientId];
    }
    
    /**
     * @dev Get total number of certificates stored
     * @return Total count of certificates
     */
    function getTotalCertificates() external view returns (uint256) {
        return certificateHashes.length;
    }
    
    /**
     * @dev Check if an address is an authorized issuer
     * @param _address The address to check
     * @return Whether the address is authorized
     */
    function isAuthorizedIssuer(address _address) external view returns (bool) {
        return authorizedIssuers[_address];
    }
}
