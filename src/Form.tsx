import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { FIELD_NAMES, NON_SELF_HOSTED, PLACEHOLDER_STRING } from "./constants";
import { login, request, sign, submit } from "./util";
import { FormState } from "./types";

const Form: FC = () => {
  const [step, setStep] = useState(0);
  const [signResponse, setSignResponse] = useState(PLACEHOLDER_STRING);
  const {
    register,
    handleSubmit,
    formState: errors,
  } = useForm({
    defaultValues: {
      handle: "",
      password: "",
      pds: NON_SELF_HOSTED,
      token: "",
    },
  });

  const onSubmit = async (data: FormState) => {
    const { handle, password, token } = data;

    const ls = localStorage.getItem("plc-recovery");

    switch (step) {
      case 0:
        if (handle !== "" && password !== "") {
          const body = {
            handle,
            password,
            refreshedAt: new Date(),
          };

          if (ls !== null) {
            const ls_ = JSON.parse(ls);
            let expired = false;

            if (
              "refreshedAt" in ls_ &&
              new Date(ls_.refreshedAt).getTime() <
                new Date().getTime() - 30 * 60 * 1000
            ) {
              expired = true;
            }

            if (
              "handle" in ls_ &&
              ls_.handle === handle &&
              "accessJwt" in ls_ &&
              !expired
            ) {
              await request(ls_);
              setStep(1);
              return;
            }

            localStorage.removeItem("plc-recovery");
          }

          const response = await login(data);

          if (response.accessJwt !== undefined) {
            const ls_ = {
              ...body,
              ...response,
            };

            localStorage.setItem("plc-recovery", JSON.stringify(ls_));

            request(ls_);
            setStep(1);
            return;
          }
        }
        break;
      case 1:
        if (ls !== null) {
          const ls_ = JSON.parse(ls);

          const response = await sign({
            ...ls_,
            token,
          });
          const json = await response.json();

          setSignResponse(JSON.stringify(json, null, 2));
          setStep(2);
        }
        break;
      case 2:
        if (ls !== null) {
          const ls_ = JSON.parse(ls);
          await submit({ ...ls_, signResponse });
          localStorage.deleteItem("plc-recovery");
        }
        break;
      default:
        break;
    }
  };

  const isLoggedIn = step > 0;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="fields">
          <div
            className={`field ${isLoggedIn ? "disabled" : ""} ${errors.errors[FIELD_NAMES.PDS] ? "error" : ""} `}
          >
            <input
              {...register(FIELD_NAMES.PDS, { required: true })}
              disabled={isLoggedIn}
              placeholder="pds"
              aria-label="PDS"
              aria-invalid={errors.errors[FIELD_NAMES.PDS] ? "true" : "false"}
            />
          </div>
          <div
            className={`field ${isLoggedIn ? "disabled" : ""} ${errors.errors[FIELD_NAMES.HANDLE] ? "error" : ""} `}
          >
            <input
              {...register(FIELD_NAMES.HANDLE, { required: true })}
              disabled={isLoggedIn}
              placeholder="@"
              aria-label="Bluesky handle"
              aria-invalid={
                errors.errors[FIELD_NAMES.HANDLE] ? "true" : "false"
              }
            />
          </div>
          <div
            className={`field ${isLoggedIn ? "disabled" : ""} ${errors.errors[FIELD_NAMES.PW] ? "error" : ""}`}
          >
            <input
              {...register(FIELD_NAMES.PW, { required: true })}
              disabled={isLoggedIn}
              placeholder="pw"
              aria-label="Password"
              aria-invalid={errors.errors[FIELD_NAMES.PW] ? "true" : "false"}
              type="password"
            />
          </div>
        </div>
        <div className="fields">
          <div className={`field ${isLoggedIn ? "" : "disabled"}`}>
            <input
              {...register(FIELD_NAMES.TOKEN, { required: step === 1 })}
              disabled={!isLoggedIn}
              placeholder="token"
              aria-label="E-mail token"
              aria-invalid={errors.errors[FIELD_NAMES.TOKEN] ? "true" : "false"}
            />
          </div>
        </div>
        <div className="fields">
          <pre>{signResponse}</pre>
        </div>
        <div className="fields">
          <p>
            create a recovery key to reverse malicious actions taken against
            your PDS within 72 hours
          </p>
          <p>login</p>
          <p>paste token from e-mail</p>
          <p>confirm and submit signed operation</p>
          <button type="submit">
            :{Array.from({ length: step + 1 }, () => ")").join("")}
          </button>
        </div>
      </form>
    </>
  );
};

export { Form };
