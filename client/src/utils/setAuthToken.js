import axios from 'axios';


// Add a global header
const setAuthToken = token => {
  // If there is a token in the localStorage, set the global header
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

export default setAuthToken;