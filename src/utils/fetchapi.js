import axios from "axios";

export const callAPI = async (method, slug, payload, token) => {
  let url = `${process.env.REACT_APP_API_URI}/${slug}`;

  let config = {
    method: method,
    maxBodyLength: Infinity,
    url: url,
    headers: {
      token: token,
      "Content-Type": "application/json",
    },
    data: payload,
  };

  return axios
    .request(config)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      return error;
    });
};
