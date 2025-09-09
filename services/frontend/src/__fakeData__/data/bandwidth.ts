// Bandwidth Analytics Mock Data
import { BandwidthStats } from '../../services/types';

export const generateMockBandwidthStats = (period: '24h' | '7d' | '30d'): BandwidthStats => {
  // Gerar dados mock baseados no período
  const dataPoints = [];
  const now = new Date();
  const pointCount = period === '24h' ? 24 : period === '7d' ? 7 : 30;
  const intervalMs =
    period === '24h'
      ? 60 * 60 * 1000
      : period === '7d'
      ? 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

  for (let i = pointCount - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMs);
    const baseDownload = 800 + Math.sin(i * 0.5) * 200 + Math.random() * 100;
    const baseUpload = 400 + Math.sin(i * 0.3) * 100 + Math.random() * 50;

    dataPoints.push({
      timestamp: timestamp.toISOString(),
      download_mbps: Math.round(baseDownload * 10) / 10,
      upload_mbps: Math.round(baseUpload * 10) / 10,
      total_mbps: Math.round((baseDownload + baseUpload) * 10) / 10,
    });
  }

  const downloadValues = dataPoints.map((p) => p.download_mbps);
  const uploadValues = dataPoints.map((p) => p.upload_mbps);

  return {
    current_download: downloadValues[downloadValues.length - 1],
    current_upload: uploadValues[uploadValues.length - 1],
    peak_download: Math.max(...downloadValues),
    peak_upload: Math.max(...uploadValues),
    average_download:
      Math.round(
        (downloadValues.reduce((a, b) => a + b, 0) / downloadValues.length) * 10
      ) / 10,
    average_upload:
      Math.round(
        (uploadValues.reduce((a, b) => a + b, 0) / uploadValues.length) * 10
      ) / 10,
    data_points: dataPoints,
  };
};

// Pre-generate common periods for faster access
export const mockBandwidthStats24h = generateMockBandwidthStats('24h');
export const mockBandwidthStats7d = generateMockBandwidthStats('7d');
export const mockBandwidthStats30d = generateMockBandwidthStats('30d');