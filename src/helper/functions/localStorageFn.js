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
  const cleanNewValue = []
  newValue.forEach((item) => {
    const compareKey = item[compare] ?? item.title ?? JSON.stringify(item);
    if (!setObj[compareKey]) {
      setObj[compareKey] = true;
      cleanNewValue.push(item);
    }
  });
  localStorage.setItem(key, JSON.stringify(cleanNewValue.slice(0, maxLength)));
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
