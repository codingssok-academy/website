declare module "JSCPP" {
  interface JSCPPOptions {
    stdio: { write: (s: string) => void; drain?: () => string };
    unsigned_overflow?: string;
  }
  const JSCPP: {
    run: (code: string, input: string, options: JSCPPOptions) => unknown;
  };
  export default JSCPP;
}
