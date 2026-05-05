export const addValueLocalStorageArray = ({
  key,
  value,
  values = [],
  compare = "id",
  maxLength = 100,
}) => {
  if (!check()) return;
  const existingParsed = getLocalStorage({ key, emptyReturn: [] });
  let newValue = [...values, ...existingParsed];
  if (!!value) newValue = [value, ...newValue];
  let setObj = {};
  const cleanNewValue = [];
  newValue.forEach((item) => {
    const compareKey = item[compare] ?? item.title ?? JSON.stringify(item);
    if (!setObj[compareKey]) {
      setObj[compareKey] = true;
      cleanNewValue.push(item);
    }
  });
  localStorage.setItem(key, JSON.stringify(cleanNewValue.slice(0, maxLength)));
  return cleanNewValue.slice(0, maxLength);
};

export const removeValueLocalStorageArray = ({
  key,
  value,
  compare = "id",
}) => {
  if (!check()) return;
  const existingParsed = getLocalStorage({ key, emptyReturn: [] });
  const newValue = existingParsed.filter(
    (item) => item[compare] != value[compare],
  );
  localStorage.setItem(key, JSON.stringify(newValue));
};

export const getLocalStorage = ({ key, emptyReturn = null }) => {
  if (!check()) return emptyReturn;
  const existing = localStorage.getItem(key);
  const existingParsed = existing ? JSON.parse(existing) : emptyReturn;
  return existingParsed;
};

const DEFAULT_CACHE_TTL = 24 * 60 * 60;

const getLocalStorageObject = ({ key }) => {
  const value = getLocalStorage({ key, emptyReturn: {} });

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
};

export const getLocalStorageCache = ({ key, cacheKey, emptyReturn = null }) => {
  if (!check()) return emptyReturn;

  try {
    const cache = getLocalStorageObject({ key });
    const item = cache?.[cacheKey];

    if (!item?.expiresAt || Date.now() > item.expiresAt) {
      if (cacheKey in cache) {
        delete cache[cacheKey];
        localStorage.setItem(key, JSON.stringify(cache));
      }

      return emptyReturn;
    }

    return item.value ?? emptyReturn;
  } catch (err) {
    console.log(err);
    return emptyReturn;
  }
};

export const setLocalStorageCache = ({
  key,
  cacheKey,
  value,
  ttl = DEFAULT_CACHE_TTL,
}) => {
  if (!check()) return;

  try {
    const cache = getLocalStorageObject({ key });

    localStorage.setItem(
      key,
      JSON.stringify({
        ...cache,
        [cacheKey]: {
          value,
          expiresAt: Date.now() + ttl * 1000,
        },
      }),
    );

    return value;
  } catch (err) {
    console.log(err);
  }
};

export const removeLocalStorage = ({ key }) => {
  if (!check()) return;
  localStorage.removeItem(key);
};

const check = () => {
  if (typeof window === "undefined") return false;
  return true;
};

export const addValueLocalStorageObject = ({
  key,
  value,
  values = {},
  compare = "id",
  maxLength = 20,
}) => {
  if (!check()) return;
  const existingParsed = getLocalStorage({ key, emptyReturn: {} });
  let newValue = { ...existingParsed, ...values, value };
  localStorage.setItem(key, JSON.stringify(newValue));
};
