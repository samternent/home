import axios from "axios";

export default axios.create({
  baseURL: "https://api.footballsocial.app/",
  // baseURL: "http://localhost:4002/",
  crossDomain: true,
});
