import LiveClientComponent from "./LiveClientComponent";

import { fetchM3U } from "../../helper/m3uFetcher";

const DEFAULT_M3U_URL = process.env.NEXT_PUBLIC_DEFAULT_M3U_URL;

const LivePage = async () => {
  const initialChannels = await fetchM3U(DEFAULT_M3U_URL);

  return <LiveClientComponent serverInitialChannels={initialChannels} />;
};

export default LivePage;
