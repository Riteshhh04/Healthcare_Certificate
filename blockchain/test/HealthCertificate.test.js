const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HealthCertificate", function () {
  let healthCertificate;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const HealthCertificate = await ethers.getContractFactory("HealthCertificate");
    healthCertificate = await HealthCertificate.deploy();
    await healthCertificate.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await healthCertificate.owner()).to.equal(owner.address);
    });

    it("Should authorize the owner as an issuer", async function () {
      expect(await healthCertificate.isAuthorizedIssuer(owner.address)).to.be.true;
    });
  });

  describe("Issuer Management", function () {
    it("Should allow owner to authorize a new issuer", async function () {
      await healthCertificate.authorizeIssuer(addr1.address);
      expect(await healthCertificate.isAuthorizedIssuer(addr1.address)).to.be.true;
    });

    it("Should allow owner to revoke an issuer", async function () {
      await healthCertificate.authorizeIssuer(addr1.address);
      await healthCertificate.revokeIssuer(addr1.address);
      expect(await healthCertificate.isAuthorizedIssuer(addr1.address)).to.be.false;
    });

    it("Should not allow non-owner to authorize issuers", async function () {
      await expect(
        healthCertificate.connect(addr1).authorizeIssuer(addr2.address)
      ).to.be.revertedWith("Only owner can perform this action");
    });
  });

  describe("Certificate Storage", function () {
    const certData = {
      certificateId: "CERT-001",
      patientId: "PATIENT-001",
      certificateType: "COVID-19 Vaccination",
      issuedBy: "City Hospital",
      issueDate: Math.floor(Date.now() / 1000)
    };

    it("Should store a certificate successfully", async function () {
      const tx = await healthCertificate.storeCertificate(
        certData.certificateId,
        certData.patientId,
        certData.certificateType,
        certData.issuedBy,
        certData.issueDate
      );

      await expect(tx).to.emit(healthCertificate, "CertificateStored");
      expect(await healthCertificate.getTotalCertificates()).to.equal(1);
    });

    it("Should not allow duplicate certificates", async function () {
      await healthCertificate.storeCertificate(
        certData.certificateId,
        certData.patientId,
        certData.certificateType,
        certData.issuedBy,
        certData.issueDate
      );

      await expect(
        healthCertificate.storeCertificate(
          certData.certificateId,
          certData.patientId,
          certData.certificateType,
          certData.issuedBy,
          certData.issueDate
        )
      ).to.be.revertedWith("Certificate already exists");
    });

    it("Should not allow unauthorized users to store certificates", async function () {
      await expect(
        healthCertificate.connect(addr1).storeCertificate(
          certData.certificateId,
          certData.patientId,
          certData.certificateType,
          certData.issuedBy,
          certData.issueDate
        )
      ).to.be.revertedWith("Not authorized to issue certificates");
    });
  });

  describe("Certificate Verification", function () {
    const certData = {
      certificateId: "CERT-002",
      patientId: "PATIENT-002",
      certificateType: "Medical Fitness",
      issuedBy: "Health Clinic",
      issueDate: Math.floor(Date.now() / 1000)
    };

    let certificateHash;

    beforeEach(async function () {
      const tx = await healthCertificate.storeCertificate(
        certData.certificateId,
        certData.patientId,
        certData.certificateType,
        certData.issuedBy,
        certData.issueDate
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "CertificateStored"
      );
      certificateHash = event.args[0];
    });

    it("Should verify a valid certificate", async function () {
      const result = await healthCertificate.verifyCertificate(certificateHash);
      
      expect(result.isValid).to.be.true;
      expect(result.certificateType).to.equal(certData.certificateType);
      expect(result.issuedBy).to.equal(certData.issuedBy);
      expect(result.revoked).to.be.false;
    });

    it("Should return invalid for non-existent certificate", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const result = await healthCertificate.verifyCertificate(fakeHash);
      
      expect(result.isValid).to.be.false;
    });

    it("Should get full certificate details", async function () {
      const result = await healthCertificate.getCertificate(certificateHash);
      
      expect(result.certificateId).to.equal(certData.certificateId);
      expect(result.patientId).to.equal(certData.patientId);
      expect(result.certificateType).to.equal(certData.certificateType);
      expect(result.exists).to.be.true;
    });
  });

  describe("Certificate Revocation", function () {
    const certData = {
      certificateId: "CERT-003",
      patientId: "PATIENT-003",
      certificateType: "Blood Test",
      issuedBy: "Lab Center",
      issueDate: Math.floor(Date.now() / 1000)
    };

    let certificateHash;

    beforeEach(async function () {
      const tx = await healthCertificate.storeCertificate(
        certData.certificateId,
        certData.patientId,
        certData.certificateType,
        certData.issuedBy,
        certData.issueDate
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "CertificateStored"
      );
      certificateHash = event.args[0];
    });

    it("Should revoke a certificate", async function () {
      await healthCertificate.revokeCertificate(certificateHash);
      
      const result = await healthCertificate.verifyCertificate(certificateHash);
      expect(result.revoked).to.be.true;
    });

    it("Should not revoke an already revoked certificate", async function () {
      await healthCertificate.revokeCertificate(certificateHash);
      
      await expect(
        healthCertificate.revokeCertificate(certificateHash)
      ).to.be.revertedWith("Certificate already revoked");
    });
  });

  describe("Patient Certificates", function () {
    it("Should track certificates per patient", async function () {
      const patientId = "PATIENT-MULTI";
      
      await healthCertificate.storeCertificate("CERT-A", patientId, "Type A", "Hospital A", Date.now());
      await healthCertificate.storeCertificate("CERT-B", patientId, "Type B", "Hospital B", Date.now());
      
      const patientCerts = await healthCertificate.getPatientCertificates(patientId);
      expect(patientCerts.length).to.equal(2);
    });
  });
});
