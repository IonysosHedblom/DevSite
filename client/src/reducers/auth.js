import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR
} from '../actions/types';

const initialState = {
  // If there is a token, put it in the state
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null
};

export default function(state = initialState, action) {
  const { type, payload } = action;

  switch(type) {
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: payload
      }
    case REGISTER_SUCCESS:
      // Set the token
      localStorage.setItem('token', payload.token);
      return {
        ...state,
        ...payload,
        isAuthenticated: true,
        loading: false
      };

    // For register fail, remove everything that is in local storage for that token
    case REGISTER_FAIL:
    case AUTH_ERROR:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    default:
      return state;
  };
};