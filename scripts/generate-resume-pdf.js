import fs from 'fs';
import path from 'path';

// Generate a valid PDF-1.4 file with text streams
function createPdfBuffer(lines) {
  let contentStream = 'BT\n/F1 16 Tf\n50 750 Td\n(Aimad Ul Islam - Cybersecurity Resume) Tj\n';
  contentStream += 'ET\nBT\n/F2 10 Tf\n50 730 Td\n(Email: info@aimadulislam.dpdns.org | Web: https://aimadulislam.dpdns.org | GitHub: https://github.com/im0d00) Tj\nET\n';
  
  let y = 690;
  contentStream += 'BT\n/F1 12 Tf\n50 ' + y + ' Td\n(PROFESSIONAL SUMMARY) Tj\nET\n';
  y -= 20;
  contentStream += 'BT\n/F2 10 Tf\n50 ' + y + ' Td\n(Cybersecurity practitioner and SOC analyst specializing in DFIR, Network Defense, and Threat Hunting.) Tj\nET\n';
  y -= 15;
  contentStream += 'BT\n/F2 10 Tf\n50 ' + y + ' Td\n(BSc Computer Science from University of Peshawar, Pakistan. Cisco Certified in 4 domains.) Tj\nET\n';
  
  y -= 30;
  contentStream += 'BT\n/F1 12 Tf\n50 ' + y + ' Td\n(VERIFIED CREDENTIALS & CERTIFICATIONS) Tj\nET\n';
  
  const certs = [
    '- Cisco Learn-A-Thon 2026 Achievement Award (Cisco Networking Academy)',
    '- Linux Essentials Certification (LPI / Cisco NetAcad)',
    '- Ethical Hacker Certification (Cisco NetAcad)',
    '- Digital Forensics & Incident Response (DFIR) (BlueCapeSecurity)',
    '- Mastercard Cybersecurity Job Simulation (Forage)',
    '- Networking Essentials Certification (Cisco NetAcad)'
  ];
  
  for (const cert of certs) {
    y -= 18;
    contentStream += 'BT\n/F2 10 Tf\n50 ' + y + ' Td\n(' + cert.replace(/[\(\)]/g, '') + ') Tj\nET\n';
  }
  
  y -= 30;
  contentStream += 'BT\n/F1 12 Tf\n50 ' + y + ' Td\n(CORE TECHNICAL SKILLS) Tj\nET\n';
  y -= 20;
  contentStream += 'BT\n/F2 10 Tf\n50 ' + y + ' Td\n(SOC: Splunk Enterprise, Snort IDS, Sysmon, Zeek, ELK, Threat Intelligence) Tj\nET\n';
  y -= 16;
  contentStream += 'BT\n/F2 10 Tf\n50 ' + y + ' Td\n(DFIR: Volatility 3, Autopsy, FTK Imager, Wireshark, Memory & Disk Forensics) Tj\nET\n';
  y -= 16;
  contentStream += 'BT\n/F2 10 Tf\n50 ' + y + ' Td\n(Network & Systems: Cisco Packet Tracer, pfSense, OSPF, ACLs, Linux Kernel Hardening, Bash, Python) Tj\nET\n';
  
  y -= 30;
  contentStream += 'BT\n/F1 12 Tf\n50 ' + y + ' Td\n(EDUCATION) Tj\nET\n';
  y -= 20;
  contentStream += 'BT\n/F2 10 Tf\n50 ' + y + ' Td\n(Bachelor of Science in Computer Science - University of Peshawar, Pakistan) Tj\nET\n';

  const streamLength = Buffer.byteLength(contentStream, 'ascii');

  const pdf = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Contents 4 0 R
  /Resources <<
    /Font <<
      /F1 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica-Bold
      >>
      /F2 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica
      >>
    >>
  >>
>>
endobj
4 0 obj
<<
  /Length ${streamLength}
>>
stream
${contentStream}endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000373 00000 n 
trailer
<<
  /Size 5
  /Root 1 0 R
>>
startxref
${450 + streamLength}
%%EOF
`;

  return Buffer.from(pdf, 'utf-8');
}

const dir = path.resolve('src/assets');
fs.mkdirSync(dir, { recursive: true });
const target = path.join(dir, 'Aimad_Ul_Islam_Resume.pdf');
fs.writeFileSync(target, createPdfBuffer());
console.log(`Successfully generated verified resume at ${target}`);
