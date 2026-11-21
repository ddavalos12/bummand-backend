export const args: string[] = ['--no-sandbox', '--disable-setuid-sandbox'];

export const executablePath = jest
  .fn()
  .mockResolvedValue('/usr/bin/chromium');

const chromium = {
  args,
  executablePath,
};

export default chromium;
