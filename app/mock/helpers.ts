export const delay = (ms = 400): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const randomId = (): string =>
  String(Date.now() + Math.floor(Math.random() * 1000));
