import crypto from 'crypto';

export interface PaymentGatewayResult {
  paymentCode?: string;
  qrString?: string;
  channelName: string;
  instruction: string;
}

/**
 * Generate simulated / real adapter payment credentials
 */
export function generatePaymentDetails(
  method: string,
  grossAmount: number,
  orderNumber: string
): PaymentGatewayResult {
  const numericOrder = orderNumber.replace(/\D/g, '').slice(-6) || '883921';

  switch (method) {
    case 'BCA_VA':
      return {
        channelName: 'BCA Virtual Account',
        paymentCode: `80777${numericOrder}`,
        instruction: 'Transfer ke nomor Virtual Account BCA melalui ATM, m-BCA, atau KlikBCA sebelum batas waktu habis.',
      };
    case 'MANDIRI_VA':
      return {
        channelName: 'Mandiri Virtual Account',
        paymentCode: `89508${numericOrder}`,
        instruction: 'Gunakan menu Bayar/Beli > Multipayment di Livin by Mandiri.',
      };
    case 'BRI_VA':
      return {
        channelName: 'BRI BRIVA',
        paymentCode: `12800${numericOrder}`,
        instruction: 'Pilih pembayaran BRIVA pada aplikasi BRImo atau ATM BRI.',
      };
    case 'QRIS':
      return {
        channelName: 'QRIS Dinamis PasarKu (Gojek, DANA, OVO, LinkAja)',
        qrString: `00020101021226670016ID.PASARKU.WWW01189360099882211440215${numericOrder}520454115303360540${grossAmount}5802ID5907PASARKU6007JAKARTA6304ABCD`,
        instruction: 'Buka aplikasi e-wallet atau mobile banking favorit Anda lalu scan kode QR di layar.',
      };
    case 'GOPAY':
      return {
        channelName: 'GoPay / GoPay Later',
        paymentCode: `GP-${numericOrder}`,
        instruction: 'Konfirmasi tagihan pada aplikasi Gojek Anda.',
      };
    case 'COD':
      return {
        channelName: 'Cash on Delivery (Bayar di Tempat)',
        instruction: 'Siapkan uang pas saat kurir mengantarkan paket ke alamat Anda.',
      };
    default:
      return {
        channelName: 'Transfer Bank Manual',
        paymentCode: `541098${numericOrder}`,
        instruction: 'Transfer ke rekening BCA PT PasarKu Karya Nusantara.',
      };
  }
}

/**
 * Verify Webhook Signature (SHA512 standard, compatible with Midtrans/Xendit)
 */
export function verifyWebhookSignature(
  orderNumber: string,
  statusCode: string,
  grossAmount: number,
  serverKey: string,
  receivedSignature: string
): boolean {
  // In DEMO simulation mode, verify standard SHA512 hash
  const payload = `${orderNumber}${statusCode}${grossAmount}${serverKey}`;
  const computedHash = crypto.createHash('sha512').update(payload).digest('hex');
  return computedHash.toLowerCase() === receivedSignature.toLowerCase();
}

/**
 * Generate signature for webhook testing / simulation
 */
export function generateTestWebhookSignature(
  orderNumber: string,
  statusCode: string,
  grossAmount: number,
  serverKey: string
): string {
  const payload = `${orderNumber}${statusCode}${grossAmount}${serverKey}`;
  return crypto.createHash('sha512').update(payload).digest('hex');
}
