import { provide, inject } from "vue";
import axios from "axios";
import { useToast } from "vue-toastification";
import { useAppVersion } from "./useAppVersion";

const useAxiosSymbol = Symbol("useAxios");

export function provideAxios() {
  const { serverVersion } = useAppVersion();
  const toast = useToast();

  const instance = axios.create({
    baseURL: import.meta.env.DEV
      ? "http://localhost:8002/"
      : "https://v1.footballsocial.app/",
    crossDomain: true,
  });

  instance.interceptors.response.use(
    function (resp) {
      if (resp.headers["x-app-version"]) {
        serverVersion.value = resp.headers["x-app-version"];
      }

      return resp;
    },
    (error) => {
      if (error.response.status === 429) {
        toast.error(
          "Sorry, our servers are very busy right now. Please try again later",
          {
            position: "bottom-right",
            timeout: 5000,
            closeOnClick: true,
            pauseOnFocusLoss: false,
            pauseOnHover: true,
            draggable: true,
            draggablePercent: 0.6,
            showCloseButtonOnHover: true,
            hideProgressBar: true,
            closeButton: "button",
            icon: true,
            rtl: false,
          }
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
