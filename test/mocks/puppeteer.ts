export const launch = jest.fn().mockResolvedValue({
  newPage: jest.fn().mockResolvedValue({
    setContent: jest.fn().mockResolvedValue(undefined),
    pdf: jest.fn().mockResolvedValue(Buffer.from('PDF_TEST')),
  }),
  close: jest.fn().mockResolvedValue(undefined),
});

const puppeteer = {
  launch,
};

export default puppeteer;
