import cookies from 'js-cookie';
import { fromJS } from 'immutable';
import { AuthUtils } from 'lattice-auth';

const { getAuthTokenExpiration } = AuthUtils;

const LICENSE_PLATE_SEARCHES = 'licensePlateSearches';

const ALL_COOKIES = [LICENSE_PLATE_SEARCHES];

function getDomain() {

  const { hostname } = window.location;
  const domain = hostname.split('.').splice(-2).join('.');
  const prefix = (hostname === 'localhost') ? '' : '.';
  return `${prefix}${domain}`;
}

const updateCookie = (cookieName, value) => {
  const { hostname } = window.location;
  cookies.set(cookieName, value, {
    SameSite: 'strict',
    domain: getDomain(),
    expires: new Date(getAuthTokenExpiration()),
    path: '/',
    secure: (hostname !== 'localhost'),
  });
};

export const clearCookies = () => {
  const domain = getDomain();
  const path = '/';

  ALL_COOKIES.forEach((cookieName) => {
    cookies.remove(cookieName, { domain, path });
  });
};


export const getPreviousLicensePlateSearches = () => fromJS(JSON.parse(cookies.get(LICENSE_PLATE_SEARCHES) || '[]'));

export const saveLicensePlateSearch = (plate) => {
  const plateList = getPreviousLicensePlateSearches().unshift(plate);
  updateCookie(LICENSE_PLATE_SEARCHES, JSON.stringify(plateList.toJS()));
};