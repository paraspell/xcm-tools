import JSZip from 'jszip';

export const downloadZip = async (data: object, csvData: string, fileName: string = 'data') => {
  const jsonData = JSON.stringify(data, null, 2);

  const zip = new JSZip();
  zip.file('data.json', jsonData);
  zip.file('data.csv', csvData);
  const content = await zip.generateAsync({ type: 'blob' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${fileName}.zip`;
  link.click();
};
