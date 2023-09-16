export const randomId = (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  return result;
};
export const randomIdWithTimeStamp = (length) => {
  return randomId(length) + Date.now().toString();
};

export const getCustomLink = () => {
  let customLink = localStorage.getItem("randomIdWithTimeStamp");
  if (!customLink) {
    customLink = randomIdWithTimeStamp(5);
    localStorage.setItem("randomIdWithTimeStamp", customLink);
  }
  return customLink;
};

export const getUserNameOrCustomLink = () => {
  return localStorage.getItem("userName") || getCustomLink().slice(0, 5);
};

export async function handleFileUpload(file) {
  if (!file) {
    console.log("No file selected.");
    return;
  }

  const url = "https://api.bayfiles.com/upload";

  // Create a FormData object and append the file to it.
  const formData = new FormData();
  formData.append("file", file);

  // Make the POST request using fetch.
  console.log("fetching");
  fetch(url, {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      console.log(response.status);
      return response.json();
    })
    .then((data) => {
      console.log("File uploaded successfully.");
      console.log(data);
      localStorage.setItem("uploadData", JSON.stringify(data));
    })
    .catch((error) => {
      console.error("Error uploading file:", error);
    });
}

export const isURL = (url) => {
  if (!url) return false;
  return url.includes("http://") || url.includes("https://");
};

export const getAllQueryParams = (url) => {
  const query = url.split("?")[1];
  const params = query.split("&");
  const obj = {};
  params.forEach((param) => {
    const [key, value] = param.split("=");
    obj[key] = value;
  });
  return obj;
};

export function secondsToHMS(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedTime =
    hours > 0
      ? `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
      : "" +
        `${minutes.toString().padStart(2, "0")}:${remainingSeconds
          .toString()
          .padStart(2, "0")}`;
  return formattedTime;
}

export const randomRGBA = (alpha = 0.25) => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r},${g},${b},${alpha})`;
};
