const FIELD_NAMES = {
  HANDLE: "handle",
  PW: "password",
  TOKEN: "token",
} as const;

const PLACEHOLDER_STRING = `{
  operation: {
    prev: "bafyrei...",
      type: "plc_operation",
      services: {
      atproto_pds: {
        type: "AtprotoPersonalDataServer",
        endpoint: "...",
      },
    },
  alsoKnownAs: ["at://..."],
  rotationKeys: [
    "...",
    "...",
    "..."
  ],
  verificationMethods: {
    atproto:  "..."
  }
}`;

export { FIELD_NAMES, PLACEHOLDER_STRING };
