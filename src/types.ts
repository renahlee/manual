import { FIELD_NAMES } from "./constants";

type FormStateKey = (typeof FIELD_NAMES)[keyof typeof FIELD_NAMES];
type FormState = Record<FormStateKey, string>;

type Session = {
  accessJwt: string;
  did: string;
  pdsServiceUrl: {
    didDoc: {
      service: string[];
    };
  };
};

type LocalStorage = Pick<Session, "accessJwt" | "did"> & {
  pdsServiceUrl: string;
};

type PlcOperation = {
  sig: string;
  prev: string | null;
  type: "plc_operation";
  services: {
    atproto_pds: {
      type: string;
      endpoint: string;
    };
  };
  alsoKnownAs: string[];
  rotationKeys: string[];
  verificationMethods: Record<string, string>;
};

export type { FormState, LocalStorage, PlcOperation, Session };
