import { provide, inject } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppVersion } from "../app/useAppVersion";
import { useCurrentUser } from "../auth/useCurrentUser";

const useAxiosSymbol = Symbol("useAxios");

export function provideAxios() {
  const { serverVersion } = useAppVersion();
  const { session } = useCurrentUser();
  const router = useRouter();

  const instance = axios.create({
    baseURL: import.meta.env.DEV
      ? "http://localhost:8002/"
      : "https://api.footballsocial.app/",
    crossDomain: true,
  });

  instance.interceptors.request.use(async function (config) {
    return {
      ...config,
      headers: {
        ...(config.headers || {}),
        "Access-Token": session.value?.access_token,
      },
    };
  });

  instance.interceptors.response.use(
    function (resp) {
      if (resp.headers["x-app-version"]) {
        serverVersion.value = resp.headers["x-app-version"];
      }

      return resp;
    },
    (error) => {
      if (error.response?.status === 429) {
        // show error message
        console.error(
          "Sorry, our servers are very busy right now. Please try again later"
        );
      }

      return Promise.reject(error);
    }
  );

  provide(useAxiosSymbol, instance);
  return instance;
}

export function useAxios() {
  return inject(useAxiosSymbol);
}
