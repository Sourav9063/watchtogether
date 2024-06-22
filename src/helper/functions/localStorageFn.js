export const addValueLocalStorageArray = ({
  key,
  value,
  values = [],
  compare = "id",
  maxLength = 20,
}) => {
  if (!check()) return;
  const existingParsed = getLocalStorage({ key, emptyReturn: [] });
  let newValue = [...values, ...existingParsed];
  if (!!value) newValue = [value, ...newValue];
  let setObj = new Set(newValue.map(JSON.stringify));
  newValue = Array.from(setObj).map(JSON.parse);
  localStorage.setItem(key, JSON.stringify(newValue.slice(0, maxLength)));
};

export const removeValueLocalStorageArray = ({
  key,
  value,
  compare = "id",
}) => {
  if (!check()) return;
  const existingParsed = getLocalStorage({ key, emptyReturn: [] });
  const newValue = existingParsed.filter(
    (item) => item[compare] != value[compare]
  );
  localStorage.setItem(key, JSON.stringify(newValue));
};

export const getLocalStorage = ({ key, emptyReturn = null }) => {
  if (!check()) return emptyReturn;
  const existing = localStorage.getItem(key);
  const existingParsed = existing ? JSON.parse(existing) : emptyReturn;
  return existingParsed;
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
