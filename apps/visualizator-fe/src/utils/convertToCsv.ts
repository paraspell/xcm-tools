type CsvRow<T> = Omit<T, '__typename'> & { paraId?: number | null };

const convertToCsv = <T>(data: CsvRow<T>[], headers: (keyof CsvRow<T>)[]): string => {
  const csvRows = data.map(row =>
    headers
      .map(header => {
        const value = row[header];
        if (value === undefined || value === null) {
          return '';
        }
        return String(value);
      })
      .join(',')
  );
  return [headers.join(','), ...csvRows].join('\n');
};

export default convertToCsv;
