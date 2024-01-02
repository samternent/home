import { provide, inject } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const useAxiosSymbol = Symbol("useAxios");

export function provideAxios() {
  const router = useRouter();

  const instance = axios.create({
    baseURL: import.meta.env.DEV
      ? "http://localhost:8001/"
      : "https://api.ternent.dev/",
    crossDomain: true,
  });

  instance.interceptors.request.use(async function (config) {
    return {
      ...config,
      headers: {
        ...(config.headers || {}),
      },
    };
  });

  instance.interceptors.response.use(
    function (resp) {
      return resp;
    },
    (error) => {
      if (error.response?.status === 429) {
        // show error message
        console.error(
          "Sorry, our servers are very busy right now. Please try again later"
        );
      }
      if (error.response?.status === 401) {
        router.push("/");
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
