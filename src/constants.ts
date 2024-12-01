const FIELD_NAMES = {
  HANDLE: "handle",
  PDS: "pds",
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

const NON_SELF_HOSTED = "bsky.social";

export { FIELD_NAMES, NON_SELF_HOSTED, PLACEHOLDER_STRING };
