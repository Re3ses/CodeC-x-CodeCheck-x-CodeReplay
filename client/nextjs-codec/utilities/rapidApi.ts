'use server';

import axios from 'axios';

const url = `${process.env.SERVER_URL}2358`;
// fuck vercel free option
export async function getAbout() {
  const options = {
    method: 'GET',
    // url: `${process.env.JUDGE0_URL}:${process.env.JUDGE0_PORT}/about`,
    url: `${url}/about`,
  };

  try {
    const response: any = await axios.request(options);
    return response;
  } catch (error) {
    console.error(error);
  }
}

export async function postSubmission(data: any) {
  const options = {
    method: 'POST',
    url: `${url}/submissions`,
    params: {
      base64_encoded: 'true',
      fields: '*',
    },
    headers: {
      'content-type': 'application/json',
      'Content-Type': 'application/json',
    },
    data,
  };
  try {
    const response: any = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getSubmission(token: string) {
  const options = {
    method: 'GET',
    url: `${url}/submissions/${token}`,
    params: {
      base64_encoded: 'true',
      wait: 'true',
      fields: '*',
    },
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getBatchSubmisisons(tokens: string) {
  const options = {
    method: 'GET',
    url: `${url}/submissions/batch`,
    params: {
      tokens: tokens,
      base64_encoded: 'true',
    },
  };
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function postBatchSubmissions(submissions: any) {
  const options = {
    method: 'POST',
    url: `${url}/submissions/batch`,
    params: {
      base64_encoded: 'true',
    },
    data: {
      submissions: submissions,
    },
  };
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getLanguages() {
  const options = {
    method: 'GET',
    // url: `${process.env.JUDGE0_URL}:${process.env.JUDGE0_PORT}/languages`,
    url: `${url}/languages`,
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getLanguage(id: number) {
  const options = {
    method: 'GET',
    url: `${url}/languages/${id}`,
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}
