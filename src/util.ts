import * as encoding from "@std/encoding";
import { FormState, LocalStorage, PlcOperation } from "./types";
import { NON_SELF_HOSTED } from "./constants";

function base64UrlDecode(value: string): Uint8Array {
  const m = value.length % 4;
  return Uint8Array.from(
    atob(
      value
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(value.length + (m === 0 ? 0 : 4 - m), "="),
    ),
    (c) => c.charCodeAt(0),
  );
}

const login = async (formState: FormState): Promise<LocalStorage> => {
  const { handle, password, pds } = formState;
  const url = `https://${pds}/xrpc/com.atproto.server.createSession`;

  const credentials = {
    identifier: handle,
    password: password,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const json = await response.json();

  const pdsServiceUrl =
    (json.didDoc?.service ?? []).length > 0
      ? `${json.didDoc?.service[0].serviceEndpoint}/xrpc`
      : "";

  return {
    accessJwt: json.accessJwt,
    did: json.did,
    pdsServiceUrl:
      pds === NON_SELF_HOSTED ? pdsServiceUrl : `https://${pds}/xrpc`,
  };
};

const save = (filename: string, data: string) => {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(data),
  );

  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

const request = async ({ accessJwt, pdsServiceUrl }: LocalStorage) => {
  const url = `${pdsServiceUrl}/com.atproto.identity.requestPlcOperationSignature`;

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessJwt}`,
      "Content-Type": "application/json",
    },
  });
};

const sign = async ({
  accessJwt,
  did,
  pdsServiceUrl,
  token,
}: LocalStorage & FormState) => {
  const plcDirectoryUrl = `https://plc.directory/${did}/log/last`;

  const plcOperationLog = await fetch(plcDirectoryUrl);
  const plcOperation: PlcOperation = await plcOperationLog.json();

  // Code from goeo :)
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"],
  );

  const pubkey = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const pubkey_array = Array.from(new Uint8Array(pubkey));

  const pld = [];

  pld.push(0x80, 0x24);
  pld.push(pubkey_array[64] % 2 ? 3 : 2);
  pld.push(...pubkey_array.slice(1, 33));

  const pkeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const pkeyBytes = base64UrlDecode(pkeyJwk.d!);
  const pkey = pkeyBytes.reduce(
    (a, b) => a + b.toString(16).padStart(2, "0"),
    "",
  );

  save(`nistp256_${did}.txt`, pkey);
  const didKey = "z" + encoding.encodeBase58(new Uint8Array(pld));

  const body = {
    token,
    rotationKeys: [`did:key:${didKey}`, ...plcOperation.rotationKeys],
    alsoKnownAs: plcOperation.alsoKnownAs,
    verificationMethods: plcOperation.verificationMethods,
    services: plcOperation.services,
  };

  const url = `${pdsServiceUrl}/com.atproto.identity.signPlcOperation`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response;
};

const submit = async ({
  accessJwt,
  pdsServiceUrl,
  signResponse,
}: {
  signResponse: string;
} & LocalStorage) => {
  const url = `${pdsServiceUrl}/com.atproto.identity.submitPlcOperation`;

  return await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessJwt}`,
      "Content-Type": "application/json",
    },
    body: signResponse,
  });
};

export { login, request, sign, submit };
