/** The concrete demo task for the hackathon submission */
export const demoTask = {
  id: 'audit-001',
  title: 'Smart Contract Security Audit',
  description: 'Audit this smart contract for security and payment-splitting risks.',
  category: 'security-audit',
  expectedDeliverables: [
    'Risk summary with severity classification',
    'List of identified vulnerabilities',
    'Remediation recommendations',
    'Confidence score (0-100)',
  ],
  contractSnippet: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentSplitter {
    address[] public payees;
    uint256[] public shares;

    constructor(address[] memory _payees, uint256[] memory _shares) {
        require(_payees.length == _shares.length, "Mismatch");
        for (uint256 i = 0; i < _payees.length; i++) {
            payees.push(_payees[i]);
            shares.push(_shares[i]);
        }
    }

    function release() external {
        uint256 balance = address(this).balance;
        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) totalShares += shares[i];
        for (uint256 i = 0; i < payees.length; i++) {
            payable(payees[i]).transfer(balance * shares[i] / totalShares);
        }
    }

    receive() external payable {}
}
`,
}
