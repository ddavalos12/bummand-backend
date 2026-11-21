export const launch = jest.fn().mockResolvedValue({
  newPage: jest.fn().mockResolvedValue({
    setDefaultTimeout: jest.fn(),
    setRequestInterception: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    setContent: jest.fn().mockResolvedValue(undefined),
    pdf: jest.fn().mockResolvedValue(Buffer.from('PDF_TEST')),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  close: jest.fn().mockResolvedValue(undefined),
});

export const executablePath = jest.fn().mockReturnValue('/usr/bin/chromium');

const puppeteer = {
  launch,
  executablePath,
};

export default puppeteer;
