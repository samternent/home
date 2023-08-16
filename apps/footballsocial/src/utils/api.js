import axios from "axios";

export default axios.create({
  baseURL: import.meta.env.DEV
    ? "http://localhost:4002/"
    : "https://api.footballsocial.app/",
  crossDomain: true,
});
